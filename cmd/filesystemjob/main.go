package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	storagev1 "k8s.io/api/storage/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

const (
	SC_PROVISIONER           = "spectrumscale.csi.ibm.com"
	MAX_RESOURCE_NAME_LENGTH = 63
	// Labels
	FS_ALLOW_DELETE_LABEL = "scale.spectrum.ibm.com/allowDelete"

	// Job operations
	OpCreateFilesystem  = "create-filesystem"
	OpCleanupFailedJob  = "cleanup-failed-job"
	OpCleanupFilesystem = "cleanup-filesystem"
	OpDeleteFilesystem  = "delete-filesystem"

	// Phase tracking annotations (for filesystem creation)
	PhaseAnnotation            = "fusion.storage.openshift.io/current-phase"
	PhaseDetailsAnnotation     = "fusion.storage.openshift.io/phase-details"
	CreatedResourcesAnnotation = "fusion.storage.openshift.io/created-resources"
)

// Phase constants (for filesystem creation)
const (
	PhaseStarting             = "starting"
	PhaseCreatingLocalDisks   = "creating-localdisks"
	PhaseCreatingFileSystem   = "creating-filesystem"
	PhaseCreatingStorageClass = "creating-storageclass"
	PhaseCompleted            = "completed"
	PhaseFailed               = "failed"
)

type LUNSpec struct {
	Path          string `json:"path"`
	WWN           string `json:"wwn"`
	Node          string `json:"node"`
	IsReused      bool   `json:"isReused"`
	LocalDiskName string `json:"localDiskName,omitempty"`
}

type CreatedResources struct {
	LocalDisks   []string `json:"localDisks"`
	FileSystem   string   `json:"fileSystem,omitempty"`
	StorageClass string   `json:"storageClass,omitempty"`
}

type PhaseDetails struct {
	CurrentPhase string `json:"currentPhase"`
	Message      string `json:"message"`
	Progress     string `json:"progress,omitempty"`
	Error        string `json:"error,omitempty"`
}

func main() {
	log.Println("Starting Fusion Access job...")

	// Read the operation type
	operation := os.Getenv("OPERATION")
	if operation == "" {
		log.Fatal("OPERATION environment variable is required")
	}

	log.Printf("Operation: %s", operation)

	// Create Kubernetes clients
	k8sConfig, err := rest.InClusterConfig()
	if err != nil {
		log.Fatalf("Failed to create in-cluster config: %v", err)
	}

	clientset, err := kubernetes.NewForConfig(k8sConfig)
	if err != nil {
		log.Fatalf("Failed to create clientset: %v", err)
	}

	dynamicClient, err := dynamic.NewForConfig(k8sConfig)
	if err != nil {
		log.Fatalf("Failed to create dynamic client: %v", err)
	}

	ctx := context.Background()

	// Route to appropriate operation
	switch operation {
	case OpCreateFilesystem:
		err = handleCreateFilesystem(ctx, clientset, dynamicClient)
	case OpCleanupFailedJob:
		err = handleCleanupFailedJob(ctx, clientset, dynamicClient)
	case OpCleanupFilesystem:
		err = handleCleanupFilesystem(ctx, clientset, dynamicClient)
	case OpDeleteFilesystem:
		err = handleDeleteFilesystem(ctx, clientset, dynamicClient)
	default:
		log.Fatalf("Unknown operation: %s", operation)
	}

	if err != nil {
		log.Fatalf("Operation failed: %v", err)
	}

	log.Printf("Operation %s completed successfully!", operation)
}

// ============================================================================
// FILESYSTEM CREATION OPERATIONS
// ============================================================================

func handleCreateFilesystem(ctx context.Context, clientset kubernetes.Interface, dynamicClient dynamic.Interface) error {
	// Read filesystem creation configuration
	fileSystemName := os.Getenv("FILESYSTEM_NAME")
	namespace := os.Getenv("NAMESPACE")
	newLunsJSON := os.Getenv("NEW_LUNS_JSON")
	reusedLunsJSON := os.Getenv("REUSED_LUNS_JSON")
	jobName := os.Getenv("JOB_NAME")

	if fileSystemName == "" {
		return fmt.Errorf("FILESYSTEM_NAME environment variable is required")
	}
	if namespace == "" {
		return fmt.Errorf("NAMESPACE environment variable is required")
	}
	if jobName == "" {
		return fmt.Errorf("JOB_NAME environment variable is required")
	}

	// Parse LUNs JSON
	var newLuns []LUNSpec
	var reusedLuns []LUNSpec

	if newLunsJSON != "" {
		if err := json.Unmarshal([]byte(newLunsJSON), &newLuns); err != nil {
			return fmt.Errorf("failed to parse NEW_LUNS_JSON: %v", err)
		}
	}

	if reusedLunsJSON != "" {
		if err := json.Unmarshal([]byte(reusedLunsJSON), &reusedLuns); err != nil {
			return fmt.Errorf("failed to parse REUSED_LUNS_JSON: %v", err)
		}
	}

	totalLuns := len(newLuns) + len(reusedLuns)
	if totalLuns == 0 {
		return fmt.Errorf("no LUNs provided for filesystem creation")
	}

	log.Printf("Creating filesystem: %s with %d new LUNs and %d reused LUNs", fileSystemName, len(newLuns), len(reusedLuns))

	// Get the job namespace
	jobNamespace := os.Getenv("FUSION_NAMESPACE")
	if jobNamespace == "" {
		jobNamespace = "ibm-fusion-access" // fallback
	}

	// Create filesystem with phase tracking
	return createResources(ctx, clientset, dynamicClient, fileSystemName, namespace, newLuns, reusedLuns, jobName, jobNamespace)
}

func createResources(ctx context.Context, clientset kubernetes.Interface, dynamicClient dynamic.Interface, fileSystemName, namespace string, newLuns, reusedLuns []LUNSpec, jobName, jobNamespace string) error {
	createdResources := &CreatedResources{}

	// Update job phase to starting
	updateJobPhase(ctx, clientset, jobNamespace, jobName, PhaseStarting, PhaseDetails{
		CurrentPhase: PhaseStarting,
		Message:      fmt.Sprintf("Starting creation of filesystem %s", fileSystemName),
		Progress:     "0/3",
	}, createdResources)

	// Step 1: Create LocalDisks (only for new LUNs)
	log.Println("Step 1: Creating LocalDisks...")
	updateJobPhase(ctx, clientset, jobNamespace, jobName, PhaseCreatingLocalDisks, PhaseDetails{
		CurrentPhase: PhaseCreatingLocalDisks,
		Message:      fmt.Sprintf("Creating %d new LocalDisk resources", len(newLuns)),
		Progress:     "1/3",
	}, createdResources)

	newLocalDiskNames, err := createLocalDisks(ctx, dynamicClient, fileSystemName, namespace, newLuns, createdResources)
	if err != nil {
		log.Printf("Failed to create LocalDisks: %v", err)
		updateJobPhase(ctx, clientset, jobNamespace, jobName, PhaseCreatingLocalDisks, PhaseDetails{
			CurrentPhase: PhaseCreatingLocalDisks,
			Message:      "Failed to create LocalDisks",
			Error:        err.Error(),
			Progress:     "1/3",
		}, createdResources)
		return err
	}
	log.Printf("Successfully created %d new LocalDisks", len(newLocalDiskNames))

	// Combine new and reused LocalDisk names
	allLocalDiskNames := newLocalDiskNames
	for _, reusedLun := range reusedLuns {
		allLocalDiskNames = append(allLocalDiskNames, reusedLun.LocalDiskName)
		createdResources.LocalDisks = append(createdResources.LocalDisks, reusedLun.LocalDiskName)
		log.Printf("Reusing existing LocalDisk: %s", reusedLun.LocalDiskName)
	}

	log.Printf("Total LocalDisks for filesystem: %d (%d new + %d reused)", len(allLocalDiskNames), len(newLocalDiskNames), len(reusedLuns))

	// Step 2: Create FileSystem
	log.Println("Step 2: Creating FileSystem...")
	updateJobPhase(ctx, clientset, jobNamespace, jobName, PhaseCreatingFileSystem, PhaseDetails{
		CurrentPhase: PhaseCreatingFileSystem,
		Message:      fmt.Sprintf("Creating FileSystem %s with %d LocalDisks", fileSystemName, len(allLocalDiskNames)),
		Progress:     "2/3",
	}, createdResources)

	err = createFileSystem(ctx, dynamicClient, fileSystemName, namespace, allLocalDiskNames)
	if err != nil {
		log.Printf("Failed to create FileSystem: %v", err)
		updateJobPhase(ctx, clientset, jobNamespace, jobName, PhaseCreatingFileSystem, PhaseDetails{
			CurrentPhase: PhaseCreatingFileSystem,
			Message:      "Failed to create FileSystem - LocalDisks have been preserved for reuse",
			Error:        err.Error(),
			Progress:     "2/3",
		}, createdResources)
		return err
	}
	createdResources.FileSystem = fileSystemName
	log.Printf("Successfully created FileSystem: %s", fileSystemName)

	// Step 3: Create StorageClass
	log.Println("Step 3: Creating StorageClass...")
	updateJobPhase(ctx, clientset, jobNamespace, jobName, PhaseCreatingStorageClass, PhaseDetails{
		CurrentPhase: PhaseCreatingStorageClass,
		Message:      fmt.Sprintf("Creating StorageClass %s", fileSystemName),
		Progress:     "3/3",
	}, createdResources)

	err = createStorageClass(ctx, clientset, fileSystemName)
	if err != nil {
		log.Printf("Failed to create StorageClass: %v", err)
		updateJobPhase(ctx, clientset, jobNamespace, jobName, PhaseCreatingStorageClass, PhaseDetails{
			CurrentPhase: PhaseCreatingStorageClass,
			Message:      "FileSystem created successfully, but StorageClass creation failed",
			Error:        err.Error(),
			Progress:     "3/3",
		}, createdResources)
		return err
	}
	createdResources.StorageClass = fileSystemName
	log.Printf("Successfully created StorageClass: %s", fileSystemName)

	// All done!
	updateJobPhase(ctx, clientset, jobNamespace, jobName, PhaseCompleted, PhaseDetails{
		CurrentPhase: PhaseCompleted,
		Message:      fmt.Sprintf("Successfully created filesystem %s with all components", fileSystemName),
		Progress:     "3/3",
	}, createdResources)

	log.Println("All resources created successfully!")
	return nil
}

// ============================================================================
// CLEANUP OPERATIONS
// ============================================================================

func handleCleanupFailedJob(ctx context.Context, clientset kubernetes.Interface, dynamicClient dynamic.Interface) error {
	targetNamespace := os.Getenv("TARGET_NAMESPACE")
	failedJobName := os.Getenv("FAILED_JOB_NAME")
	failedJobNamespace := os.Getenv("FAILED_JOB_NAMESPACE")
	createdResourcesJSON := os.Getenv("CREATED_RESOURCES")

	if targetNamespace == "" {
		return fmt.Errorf("TARGET_NAMESPACE is required")
	}

	log.Printf("Cleaning up failed job: %s in namespace %s", failedJobName, failedJobNamespace)

	// Parse created resources
	var createdResources CreatedResources
	if createdResourcesJSON != "" {
		if err := json.Unmarshal([]byte(createdResourcesJSON), &createdResources); err != nil {
			log.Printf("Failed to parse created resources JSON, continuing without it: %v", err)
		}
	}

	return cleanupFailedJob(ctx, clientset, dynamicClient, targetNamespace, failedJobName, failedJobNamespace, &createdResources)
}

func handleCleanupFilesystem(ctx context.Context, clientset kubernetes.Interface, dynamicClient dynamic.Interface) error {
	targetName := os.Getenv("TARGET_NAME")
	targetNamespace := os.Getenv("TARGET_NAMESPACE")
	failedJobName := os.Getenv("FAILED_JOB_NAME")
	failedJobNamespace := os.Getenv("FAILED_JOB_NAMESPACE")

	if targetName == "" || targetNamespace == "" {
		return fmt.Errorf("TARGET_NAME and TARGET_NAMESPACE are required")
	}

	log.Printf("Cleaning up filesystem: %s and related job: %s", targetName, failedJobName)

	// First remove the failed job if it exists
	if failedJobName != "" && failedJobNamespace != "" {
		log.Printf("Removing related failed Job: %s", failedJobName)
		err := clientset.BatchV1().Jobs(failedJobNamespace).Delete(ctx, failedJobName, metav1.DeleteOptions{})
		if err != nil {
			log.Printf("Failed to delete Job %s (continuing): %v", failedJobName, err)
		} else {
			log.Printf("Successfully deleted related Job: %s", failedJobName)
		}
	}

	// Then delete the filesystem and its storage class
	return deleteFilesystem(ctx, clientset, dynamicClient, targetName, targetNamespace)
}

func handleDeleteFilesystem(ctx context.Context, clientset kubernetes.Interface, dynamicClient dynamic.Interface) error {
	targetName := os.Getenv("TARGET_NAME")
	targetNamespace := os.Getenv("TARGET_NAMESPACE")

	if targetName == "" || targetNamespace == "" {
		return fmt.Errorf("TARGET_NAME and TARGET_NAMESPACE are required")
	}

	return deleteFilesystem(ctx, clientset, dynamicClient, targetName, targetNamespace)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func updateJobPhase(ctx context.Context, clientset kubernetes.Interface, namespace, jobName, phase string, details PhaseDetails, resources *CreatedResources) {
	log.Printf("Phase update: %s - %s", phase, details.Message)

	// Convert details and resources to JSON
	detailsJSON, _ := json.Marshal(details)
	resourcesJSON, _ := json.Marshal(resources)

	// Patch the job with updated annotations
	patchData := map[string]any{
		"metadata": map[string]any{
			"annotations": map[string]string{
				PhaseAnnotation:            phase,
				PhaseDetailsAnnotation:     string(detailsJSON),
				CreatedResourcesAnnotation: string(resourcesJSON),
			},
		},
	}

	patchBytes, err := json.Marshal(patchData)
	if err != nil {
		log.Printf("Failed to marshal patch data: %v", err)
		return
	}

	_, err = clientset.BatchV1().Jobs(namespace).Patch(ctx, jobName, types.MergePatchType, patchBytes, metav1.PatchOptions{})
	if err != nil {
		log.Printf("Failed to update job phase: %v", err)
		// Don't fail the whole job for this
	}
}

func createLocalDisks(ctx context.Context, client dynamic.Interface, fileSystemName, namespace string, luns []LUNSpec, createdResources *CreatedResources) ([]string, error) {
	localDiskGVR := schema.GroupVersionResource{
		Group:    "scale.spectrum.ibm.com",
		Version:  "v1beta1",
		Resource: "localdisks",
	}

	var localDiskNames []string

	for i, lun := range luns {
		localDiskName := sanitizeName(fmt.Sprintf("%s-%s",
			strings.TrimPrefix(lun.Path, "/dev/"),
			lun.WWN))

		localDisk := &unstructured.Unstructured{
			Object: map[string]any{
				"apiVersion": "scale.spectrum.ibm.com/v1beta1",
				"kind":       "LocalDisk",
				"metadata": map[string]any{
					"name":      localDiskName,
					"namespace": namespace,
					"labels": map[string]any{
						"fusion.storage.openshift.io/filesystem-job":  "true",
						"fusion.storage.openshift.io/filesystem-name": fileSystemName,
					},
				},
				"spec": map[string]any{
					"device": lun.Path,
					"node":   lun.Node,
				},
			},
		}

		log.Printf("Creating LocalDisk %d/%d: %s", i+1, len(luns), localDiskName)
		_, err := client.Resource(localDiskGVR).Namespace(namespace).Create(ctx, localDisk, metav1.CreateOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create LocalDisk %s: %v", localDiskName, err)
		}

		localDiskNames = append(localDiskNames, localDiskName)
		createdResources.LocalDisks = append(createdResources.LocalDisks, localDiskName)
	}

	return localDiskNames, nil
}

func createFileSystem(ctx context.Context, client dynamic.Interface, fileSystemName, namespace string, localDiskNames []string) error {
	filesystemGVR := schema.GroupVersionResource{
		Group:    "scale.spectrum.ibm.com",
		Version:  "v1beta1",
		Resource: "filesystems",
	}

	filesystem := &unstructured.Unstructured{
		Object: map[string]any{
			"apiVersion": "scale.spectrum.ibm.com/v1beta1",
			"kind":       "Filesystem",
			"metadata": map[string]any{
				"name":      fileSystemName,
				"namespace": namespace,
			},
			"spec": map[string]any{
				"local": map[string]any{
					"pools": []any{
						map[string]any{
							"disks": localDiskNames,
						},
					},
					"replication": "1-way",
					"type":        "shared",
				},
			},
		},
	}

	_, err := client.Resource(filesystemGVR).Namespace(namespace).Create(ctx, filesystem, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create FileSystem %s: %v", fileSystemName, err)
	}

	return nil
}

func createStorageClass(ctx context.Context, clientset kubernetes.Interface, fileSystemName string) error {
	storageClass := &storagev1.StorageClass{
		ObjectMeta: metav1.ObjectMeta{
			Name: fileSystemName,
		},
		Provisioner: SC_PROVISIONER,
		Parameters: map[string]string{
			"volBackendFs": fileSystemName,
		},
	}

	_, err := clientset.StorageV1().StorageClasses().Create(ctx, storageClass, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create StorageClass %s: %v", fileSystemName, err)
	}

	return nil
}

func cleanupFailedJob(ctx context.Context, clientset kubernetes.Interface, dynamicClient dynamic.Interface, targetNamespace, failedJobName, failedJobNamespace string, createdResources *CreatedResources) error {
	// Clean up resources in reverse order (StorageClass -> FileSystem -> Job)
	// Don't clean up LocalDisks - they can be reused

	// 1. Remove StorageClass if it was created
	if createdResources.StorageClass != "" {
		log.Printf("Removing StorageClass: %s", createdResources.StorageClass)
		err := clientset.StorageV1().StorageClasses().Delete(ctx, createdResources.StorageClass, metav1.DeleteOptions{})
		if err != nil {
			log.Printf("Failed to delete StorageClass %s (continuing): %v", createdResources.StorageClass, err)
		} else {
			log.Printf("Successfully deleted StorageClass: %s", createdResources.StorageClass)
		}
	}

	// 2. Remove FileSystem if it was created
	if createdResources.FileSystem != "" {
		log.Printf("Removing FileSystem: %s", createdResources.FileSystem)
		filesystemGVR := schema.GroupVersionResource{
			Group:    "scale.spectrum.ibm.com",
			Version:  "v1beta1",
			Resource: "filesystems",
		}
		err := dynamicClient.Resource(filesystemGVR).Namespace(targetNamespace).Delete(ctx, createdResources.FileSystem, metav1.DeleteOptions{})
		if err != nil {
			log.Printf("Failed to delete FileSystem %s (continuing): %v", createdResources.FileSystem, err)
		} else {
			log.Printf("Successfully deleted FileSystem: %s", createdResources.FileSystem)
		}
	}

	// 3. Remove the failed job itself
	if failedJobName != "" && failedJobNamespace != "" {
		log.Printf("Removing failed Job: %s", failedJobName)
		err := clientset.BatchV1().Jobs(failedJobNamespace).Delete(ctx, failedJobName, metav1.DeleteOptions{})
		if err != nil {
			log.Printf("Failed to delete Job %s (continuing): %v", failedJobName, err)
		} else {
			log.Printf("Successfully deleted failed Job: %s", failedJobName)
		}
	}

	return nil
}

func deleteFilesystem(ctx context.Context, clientset kubernetes.Interface, dynamicClient dynamic.Interface, targetName, targetNamespace string) error {
	log.Printf("Deleting filesystem: %s in namespace %s", targetName, targetNamespace)

	filesystemGVR := schema.GroupVersionResource{
		Group:    "scale.spectrum.ibm.com",
		Version:  "v1beta1",
		Resource: "filesystems",
	}

	// Get the filesystem first to check if it has the deletion label
	filesystem, err := dynamicClient.Resource(filesystemGVR).Namespace(targetNamespace).Get(ctx, targetName, metav1.GetOptions{})
	if err != nil {
		log.Printf("Failed to get FileSystem %s: %v", targetName, err)
		return err
	}

	// Add deletion label if not present
	labels := filesystem.GetLabels()
	if labels == nil {
		labels = make(map[string]string)
	}

	if _, hasLabel := labels[FS_ALLOW_DELETE_LABEL]; !hasLabel {
		labels[FS_ALLOW_DELETE_LABEL] = ""
		filesystem.SetLabels(labels)

		log.Printf("Adding deletion label to FileSystem: %s", targetName)
		_, err = dynamicClient.Resource(filesystemGVR).Namespace(targetNamespace).Update(ctx, filesystem, metav1.UpdateOptions{})
		if err != nil {
			log.Printf("Failed to add deletion label to FileSystem %s: %v", targetName, err)
			return err
		}
	}

	// Delete the filesystem
	log.Printf("Deleting FileSystem: %s", targetName)
	err = dynamicClient.Resource(filesystemGVR).Namespace(targetNamespace).Delete(ctx, targetName, metav1.DeleteOptions{})
	if err != nil {
		log.Printf("Failed to delete FileSystem %s: %v", targetName, err)
		return err
	}
	log.Printf("Successfully deleted FileSystem: %s", targetName)

	// Delete the associated storage class
	log.Printf("Deleting StorageClass: %s", targetName)
	err = clientset.StorageV1().StorageClasses().Delete(ctx, targetName, metav1.DeleteOptions{})
	if err != nil {
		log.Printf("Failed to delete StorageClass %s (continuing): %v", targetName, err)
	} else {
		log.Printf("Successfully deleted StorageClass: %s", targetName)
	}

	// Note: We don't delete LocalDisks - they can be reused in future filesystem creation

	return nil
}

func sanitizeName(name string) string {
	// Replace invalid characters with dashes and ensure DNS compliance
	name = strings.ReplaceAll(name, "_", "-")
	name = strings.ReplaceAll(name, ":", "-")
	name = strings.ToLower(name)

	// Ensure it starts and ends with alphanumeric characters
	if len(name) > MAX_RESOURCE_NAME_LENGTH {
		name = name[:MAX_RESOURCE_NAME_LENGTH]
	}

	return name
}
