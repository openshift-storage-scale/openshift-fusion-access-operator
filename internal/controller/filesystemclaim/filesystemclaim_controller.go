/*
Copyright 2025.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package filesystemclaim

import (
	"context"
	cryptorand "crypto/rand"
	"fmt"
	"math/big"
	"reflect"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"k8s.io/apimachinery/pkg/api/errors"
	apimeta "k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/util/retry"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/builder"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/event"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/predicate"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/utils"
	corev1 "k8s.io/api/core/v1"
	storagev1 "k8s.io/api/storage/v1"
	"k8s.io/utils/ptr"
)

const (
	// FileSystemClaimFinalizer is the finalizer name for cleanup operations
	FileSystemClaimFinalizer = "fusion.storage.openshift.io/filesystemclaim-finalizer"

	maxKubernetesNameLength = 253

	// Reason constants for LocalDisk creation
	ReasonLocalDiskCreationFailed     = "LocalDiskCreationFailed"
	ReasonLocalDiskCreationSucceeded  = "LocalDiskCreationSucceeded"
	ReasonLocalDiskCreationInProgress = "LocalDiskCreationInProgress"

	// Reason constants for FileSystem creation
	ReasonFileSystemCreationFailed     = "FileSystemCreationFailed"
	ReasonFileSystemCreationSucceeded  = "FileSystemCreationSucceeded"
	ReasonFileSystemCreationInProgress = "FileSystemCreationInProgress"

	// Reason constants for StorageClass creation
	ReasonStorageClassCreationFailed     = "StorageClassCreationFailed"
	ReasonStorageClassCreationSucceeded  = "StorageClassCreationSucceeded"
	ReasonStorageClassCreationInProgress = "StorageClassCreationInProgress"

	// Reason constants for Device validation
	ReasonDeviceValidationFailed    = "DeviceValidationFailed"
	ReasonDeviceValidationSucceeded = "DeviceValidationSucceeded"

	// Reason constants for Deletion blocking
	ReasonStorageClassInUse         = "StorageClassInUse"
	ReasonFileSystemLabelNotPresent = "FileSystemLabelNotPresent"

	// Reason constants for successful deletions
	ReasonStorageClassDeleted = "StorageClassDeleted"
	ReasonFilesystemDeleted   = "FilesystemDeleted"
	ReasonLocalDiskDeleted    = "LocalDiskDeleted"

	// Reason constants for overall provisioning status
	ReasonProvisioningFailed     = "ProvisioningFailed"
	ReasonProvisioningSucceeded  = "ProvisioningSucceeded"
	ReasonProvisioningInProgress = "ProvisioningInProgress"

	// Reason constants for validation failures
	ReasonValidationFailed       = "ValidationFailed"
	ReasonDeviceNotFound         = "DeviceNotFound"
	ReasonDeviceInUse            = "DeviceInUse"
	ReasonDeletionRequested      = "DeletionRequested"
	ReasonImmutableFieldModified = "ImmutableFieldModified"

	// IBM Spectrum Scale resource information
	LocalDiskGroup   = "scale.spectrum.ibm.com"
	LocalDiskVersion = "v1beta1"
	LocalDiskKind    = "LocalDisk"
	LocalDiskList    = "LocalDiskList"

	FileSystemGroup   = "scale.spectrum.ibm.com"
	FileSystemVersion = "v1beta1"
	FileSystemKind    = "Filesystem"
	FileSystemList    = "FilesystemList"

	FileSystemClaimKind = "FileSystemClaim"

	// Node validation labels
	ScaleStorageRoleLabel = "scale.spectrum.ibm.com/role"
	ScaleStorageRoleValue = "storage"
	WorkerNodeRoleLabel   = "node-role.kubernetes.io/worker"

	// Labels
	FileSystemClaimOwnedByNameLabel      = "fusion.storage.openshift.io/owned-by-fsc-name"
	FileSystemClaimOwnedByNamespaceLabel = "fusion.storage.openshift.io/owned-by-fsc-namespace"
	StorageClassDefaultAnnotation        = "storageclass.kubevirt.io/is-default-virt-class"
	FileSystemDeletionLabel              = "scale.spectrum.ibm.com/allowDelete"
)

// FileSystemClaimReconciler reconciles a FileSystemClaim object
type FileSystemClaimReconciler struct {
	client.Client
	Scheme *runtime.Scheme
	// Configurable requeue delays for testing and optimization
	RequeueDelay time.Duration
}

// +kubebuilder:rbac:groups=fusion.storage.openshift.io,resources=filesystemclaims,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=fusion.storage.openshift.io,resources=filesystemclaims/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=fusion.storage.openshift.io,resources=filesystemclaims/finalizers,verbs=update
// +kubebuilder:rbac:groups=fusion.storage.openshift.io,resources=localvolumediscoveryresults,verbs=get;list;watch
// +kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=localdisks,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=filesystems,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=storage.k8s.io,resources=storageclasses,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=persistentvolumes,verbs=get;list;watch

func (r *FileSystemClaimReconciler) Reconcile(
	ctx context.Context,
	req ctrl.Request,
) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	// Fetch the request
	fsc := &fusionv1alpha1.FileSystemClaim{}

	if err := r.Get(ctx, req.NamespacedName, fsc); errors.IsNotFound(err) {
		// This is normal - object might have been deleted or not yet in cache
		logger.V(1).Info("FileSystemClaim not found, likely deleted or cache lag", "name", req.Name)
		return ctrl.Result{}, nil
	} else if err != nil {
		logger.Error(err, "Failed to get FileSystemClaim", "name", req.Name)
		return ctrl.Result{}, err
	}

	logger.Info("Reconciling FileSystemClaim", "name", fsc.Name, "namespace", fsc.Namespace)

	// Finalizers first
	if changed, err := r.handleFinalizers(ctx, fsc); err != nil {
		return ctrl.Result{}, err
	} else if changed {
		// We wrote something (finalizer add/remove). Requeue to read fresh.
		return ctrl.Result{RequeueAfter: r.RequeueDelay}, nil
	}

	// Handle deletion
	if requeueAfter, changed, err := r.handleDeletion(ctx, fsc); err != nil {
		return ctrl.Result{}, err
	} else if requeueAfter > 0 {
		// Deletion is blocked, retry with exponential backoff
		return ctrl.Result{RequeueAfter: requeueAfter}, nil
	} else if changed {
		return ctrl.Result{RequeueAfter: r.RequeueDelay}, nil
	}

	// 1) Ensure LocalDisks exist (create/update if needed)
	if changed, err := r.ensureLocalDisks(ctx, fsc); err != nil {
		return ctrl.Result{}, err
	} else if changed {
		// We created/updated children; let cache/watches settle.
		return ctrl.Result{RequeueAfter: r.RequeueDelay}, nil
	}

	// 2) Sync FSC conditions from owned LocalDisks
	if changed, err := r.syncLocalDiskConditions(ctx, fsc); err != nil {
		return ctrl.Result{}, err
	} else if changed {
		// We updated FSC status; that's a write -> requeue once.
		return ctrl.Result{RequeueAfter: r.RequeueDelay}, nil
	}

	// 3) Ensure Filesystems (only if LD preconditions are satisfied)
	if changed, err := r.ensureFileSystem(ctx, fsc); err != nil {
		return ctrl.Result{}, err
	} else if changed {
		return ctrl.Result{RequeueAfter: r.RequeueDelay}, nil
	}

	// 4) Sync FSC conditions from owned Filesystems
	if changed, err := r.syncFilesystemConditions(ctx, fsc); err != nil {
		return ctrl.Result{}, err
	} else if changed {
		return ctrl.Result{RequeueAfter: r.RequeueDelay}, nil
	}

	// 5) Ensure StorageClass (only after Filesystem ready)
	if changed, err := r.ensureStorageClass(ctx, fsc); err != nil {
		return ctrl.Result{}, err
	} else if changed {
		return ctrl.Result{RequeueAfter: r.RequeueDelay}, nil
	}

	// 6) Aggregate/Ready
	if changed, err := r.syncFSCReady(ctx, fsc); err != nil {
		return ctrl.Result{}, err
	} else if changed {
		return ctrl.Result{RequeueAfter: r.RequeueDelay}, nil
	}

	logger.Info("FileSystemClaim reconciliation completed successfully")
	return ctrl.Result{}, nil
}

// Handlers for FileSystemClaim reconciliation -- START

// handleFinalizers handles the finalizers for the FileSystemClaim
func (r *FileSystemClaimReconciler) handleFinalizers(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	logger := log.FromContext(ctx)

	// If the FileSystemClaim is being deleted, no need to add/remove finalizers
	if fsc.DeletionTimestamp != nil {
		return false, nil
	}

	if !controllerutil.ContainsFinalizer(fsc, FileSystemClaimFinalizer) {
		if err := r.patchFSCSpec(ctx, fsc, func(cur *fusionv1alpha1.FileSystemClaim) {
			controllerutil.AddFinalizer(cur, FileSystemClaimFinalizer)
		}); err != nil {
			logger.Error(err, "Failed to add finalizer")
			return false, err
		}
		logger.Info("Added finalizer", "name", fsc.Name)
		return true, nil
	}
	return false, nil
}

// handleDeletion handles the deletion of FileSystemClaim and cleans up resources
// Returns: (requeueAfter time.Duration, changed bool, err error)
// - requeueAfter > 0: deletion is blocked, requeue with exponential backoff
// - changed = true: status was updated, requeue normally
// - err != nil: error occurred
func (r *FileSystemClaimReconciler) handleDeletion(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (time.Duration, bool, error) {
	logger := log.FromContext(ctx)

	// Nothing to Delete
	if fsc.DeletionTimestamp == nil {
		return 0, false, nil
	}

	// Deletiontimestamp is set, so we need to cleanup
	if !controllerutil.ContainsFinalizer(fsc, FileSystemClaimFinalizer) {
		return 0, false, nil
	}

	logger.Info("Handling deletion of FileSystemClaim", "name", fsc.Name)

	// Mark FSC as deletion requested
	if changed, err := r.markDeletionRequested(ctx, fsc); changed || err != nil {
		return 0, changed, err
	}

	// Check for blocking conditions
	if requeueAfter, changed, err := r.checkStorageClassUsage(ctx, fsc); requeueAfter > 0 || changed || err != nil {
		return requeueAfter, changed, err
	}
	if requeueAfter, changed, err := r.checkFilesystemDeletionLabel(ctx, fsc); requeueAfter > 0 || changed || err != nil {
		return requeueAfter, changed, err
	}

	// Delete resources in order: SC -> FS -> LD
	if changed, err := r.deleteStorageClass(ctx, fsc); changed || err != nil {
		return 0, changed, err
	}
	if requeueAfter, changed, err := r.deleteFilesystem(ctx, fsc); requeueAfter > 0 || changed || err != nil {
		return requeueAfter, changed, err
	}
	if requeueAfter, changed, err := r.deleteLocalDisks(ctx, fsc); requeueAfter > 0 || changed || err != nil {
		return requeueAfter, changed, err
	}

	// All resources deleted, remove finalizer
	changed, err := r.removeFinalizer(ctx, fsc)
	return 0, changed, err
}

// ensureLocalDisk creates LocalDisk/s
func (r *FileSystemClaimReconciler) ensureLocalDisks(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	logger := log.FromContext(ctx)

	// If LocalDisks are already created, verify spec.devices hasn't changed
	// This is a safety check in case the webhook is disabled or bypassed
	if r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeLocalDiskCreated) {
		// Get owned LocalDisks and verify they match current spec.devices
		owned, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
			Group:   LocalDiskGroup,
			Version: LocalDiskVersion,
			Kind:    LocalDiskKind,
		}, LocalDiskList)
		if err != nil {
			return false, fmt.Errorf("failed to list owned LocalDisks: %w", err)
		}

		// Extract device paths from owned LocalDisks
		ownedDevices := make(map[string]struct{})
		for _, ld := range owned {
			devicePath, _, _ := unstructured.NestedString(ld.Object, "spec", "device")
			if devicePath != "" {
				ownedDevices[devicePath] = struct{}{}
			}
		}

		// Check if spec.devices matches owned LocalDisks
		specDevices := make(map[string]struct{})
		for _, device := range fsc.Spec.Devices {
			specDevices[device] = struct{}{}
		}

		// Compare the two sets
		if !reflect.DeepEqual(ownedDevices, specDevices) {
			errMsg := fmt.Sprintf("spec.devices was modified after LocalDisks were created. "+
				"Original: %v, Current: %v. "+
				"Either delete this FileSystemClaim (%s) and create new with desired devices, "+
				"or create a new FileSystemClaim with UNUSED and AVAILABLE shared devices.",
				mapKeysToSlice(ownedDevices), fsc.Spec.Devices, fsc.Name)
			logger.Info(errMsg)

			// Set error condition
			if e := r.patchFSCStatus(ctx, fsc, func(cur *fusionv1alpha1.FileSystemClaim) {
				cur.Status.Conditions = utils.UpdateCondition(
					cur.Status.Conditions,
					fusionv1alpha1.ConditionTypeReady,
					metav1.ConditionFalse,
					ReasonImmutableFieldModified,
					errMsg,
					cur.Generation,
				)
			}); e != nil {
				return false, e
			}
			return true, nil
		}

		return false, nil
	}

	// If localDisk creation is in progress, no need to create LocalDisks again
	if r.hasConditionWithReason(fsc.Status.Conditions, fusionv1alpha1.ConditionTypeLocalDiskCreated, ReasonLocalDiskCreationInProgress) {
		return false, nil
	}

	// Phase 1: validate once
	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeDeviceValidated) {
		if err := r.validateDevices(ctx, fsc); err != nil {
			logger.Error(err, "Device validation failed")
			if e := r.handleValidationError(ctx, fsc, err); e != nil {
				logger.Error(e, "Failed to update status after disk validation failure")
				return false, e
			}
			return true, nil
		}

		if _, e := r.updateConditionIfChanged(ctx, fsc, fusionv1alpha1.ConditionTypeDeviceValidated, metav1.ConditionTrue, ReasonDeviceValidationSucceeded, "Device/s validation succeeded"); e != nil {
			logger.Error(e, "Failed to update status after device validation success")
			return false, e
		}
		return true, nil
	}

	// Get node name first - the same node will be used for all LocalDisks
	nodeName, selErr := r.getRandomStorageNode(ctx)
	if selErr != nil {
		logger.Error(selErr, "failed to pick a storage node")
		if e := r.handleResourceCreationError(ctx, fsc, "LocalDisk", selErr); e != nil {
			return false, e
		}
		return true, nil
	}

	// variable to track if we need to requeue the reconciliation
	var requeue bool

	// Phase 2: ensure LocalDisks
	for _, devicePath := range fsc.Spec.Devices {
		// Get WWN for the device
		// this will fail if the device is not found in any of the LocalVolumeDiscoveryResult
		wwn, err := r.getDeviceWWN(ctx, devicePath, nodeName)
		if err != nil {
			logger.Error(err, "failed to get WWN for device", "device", devicePath, "node", nodeName)
			if e := r.handleResourceCreationError(ctx, fsc, "LocalDisk", err); e != nil {
				return false, e
			}
			return true, nil
		}

		// Generate LocalDisk name from WWN
		localDiskName, err := generateLocalDiskName(wwn)
		if err != nil {
			logger.Error(err, "failed to generate LocalDisk name", "wwn", wwn)
			if e := r.handleResourceCreationError(ctx, fsc, "LocalDisk", err); e != nil {
				return false, e
			}
			return true, nil
		}

		ld := &unstructured.Unstructured{}
		ld.SetGroupVersionKind(schema.GroupVersionKind{
			Group:   LocalDiskGroup,
			Version: LocalDiskVersion,
			Kind:    LocalDiskKind,
		})
		ld.SetName(localDiskName) // Set the name before using it

		err = r.Get(ctx, types.NamespacedName{
			Namespace: fsc.Namespace,
			Name:      localDiskName,
		}, ld)

		switch {
		case errors.IsNotFound(err):
			// Create LocalDisk with new naming
			spec := map[string]any{"device": devicePath, "node": nodeName}
			if err := r.createResourceWithOwnership(ctx, fsc, ld, spec); err != nil {
				logger.Error(err, "failed to create LocalDisk", "name", localDiskName)
				if e := r.handleResourceCreationError(ctx, fsc, "LocalDisk", err); e != nil {
					return false, e
				}
				return true, nil
			}

			logger.Info("Creating LocalDisk", "name", localDiskName, "device", devicePath, "node", nodeName)
			_, e := r.updateConditionIfChanged(
				ctx, fsc,
				fusionv1alpha1.ConditionTypeLocalDiskCreated,
				metav1.ConditionFalse,
				ReasonLocalDiskCreationInProgress,
				"LocalDisks created, waiting for them to become ready",
			)
			if e != nil {
				return false, e
			}

			requeue = true
			continue

		case err != nil:
			return false, fmt.Errorf("failed to get LocalDisk %s: %w", localDiskName, err)

		default:
			// Check for drift and patch if needed
			// There is a admission webhook that prevents the update of spec.device, spec.node and spec.thinDiskType after the LocalDisk is created.
			// example error:
			// ... cannot be edited because a related NSD is already created in Storage Scale
			logger.Info("localDisk already exists, skipping drift detection and patching", "name", localDiskName)
			return false, nil
		}
	}

	if requeue {
		return true, nil
	}

	return false, nil
}

// syncLocalDiskConditions inspects all LocalDisks owned by this FSC and updates
// fusionv1alpha1.ConditionTypeLocalDiskCreated with a precise reason/message. Returns changed=true if we wrote status.
func (r *FileSystemClaimReconciler) syncLocalDiskConditions(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	logger := log.FromContext(ctx)

	// 1) List owned LocalDisks
	owned, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
		Group:   LocalDiskGroup,
		Version: LocalDiskVersion,
		Kind:    LocalDiskKind,
	}, LocalDiskList)
	if err != nil {
		return false, err
	}

	// 2) If none yet but validated, mark in-progress (idempotent)
	if len(owned) == 0 {
		if r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeDeviceValidated) {
			changed, err := r.updateConditionIfChanged(ctx, fsc, fusionv1alpha1.ConditionTypeLocalDiskCreated, metav1.ConditionFalse, ReasonLocalDiskCreationInProgress, "Waiting for LocalDisk objects to appear")
			if err != nil {
				return false, err
			}
			if !changed {
				logger.Info("LocalDiskCreated unchanged (no LDs yet); skipping patch")
			}
			return changed, nil
		}
		return false, nil
	}

	// 3) Collect names of Filesystems owned by this FSC (used to validate Used=True cases)
	ownedFS := map[string]struct{}{}
	ownedFS[fsc.Name] = struct{}{} // include the deterministic name even if informer lagged

	// Also check for any existing filesystems owned by this FSC
	ownedFilesystems, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
		Group:   FileSystemGroup,
		Version: FileSystemVersion,
		Kind:    FileSystemKind,
	}, FileSystemList)
	if err == nil {
		for _, fs := range ownedFilesystems {
			ownedFS[fs.GetName()] = struct{}{}
		}
	}

	// 4) Check health of all LocalDisks
	allGood, failingName, failingMsg, hardFailure := r.checkAllResourcesHealthy(owned, []string{"Ready", "Used"}, ownedFS)

	// 5) Desired FSC condition
	var desiredStatus metav1.ConditionStatus
	var desiredReason, desiredMsg string

	if allGood {
		desiredStatus = metav1.ConditionTrue
		desiredReason = ReasonLocalDiskCreationSucceeded
		desiredMsg = fmt.Sprintf("All %d LocalDisks are Ready; if used, they are used by this Filesystem.", len(owned))
	} else {
		desiredStatus = metav1.ConditionFalse
		if hardFailure {
			desiredReason = ReasonLocalDiskCreationFailed
		} else {
			desiredReason = ReasonLocalDiskCreationInProgress
		}
		desiredMsg = fmt.Sprintf("LocalDisk %s: %s", failingName, failingMsg)
	}

	// 6) Update condition if changed
	changed, err := r.updateConditionIfChanged(ctx, fsc, fusionv1alpha1.ConditionTypeLocalDiskCreated, desiredStatus, desiredReason, desiredMsg)
	if err != nil {
		return false, err
	}

	if !changed {
		logger.Info("LocalDiskCreated condition unchanged; skipping patch")
		// there was no change, so we don't need to requeue
		return false, nil
	}

	logger.Info("synced LocalDisk conditions", "fsc", fsc.Name, "owned", len(owned), "allGood", allGood)
	return changed, nil
}

// ensureFileSystem creates FileSystem if it doesn't exist and returns its ready status
func (r *FileSystemClaimReconciler) ensureFileSystem(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	logger := log.FromContext(ctx)

	// If localdisks are not created, we can't create a filesystem
	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeLocalDiskCreated) {
		return false, nil
	}

	ownedLDs, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
		Group:   LocalDiskGroup,
		Version: LocalDiskVersion,
		Kind:    LocalDiskKind,
	}, LocalDiskList)
	if err != nil {
		return false, fmt.Errorf("list LocalDisks: %w", err)
	}

	var ldNames []string
	for _, ld := range ownedLDs {
		ldNames = append(ldNames, ld.GetName())
	}
	if len(ldNames) == 0 {
		logger.Info("ensureFileSystem: no owned LocalDisks found despite LocalDiskCreated=True; skipping")
		return false, nil
	}

	desiredSpec := buildFilesystemSpec(ldNames)

	// List existing owned Filesystems
	owned, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
		Group:   FileSystemGroup,
		Version: FileSystemVersion,
		Kind:    FileSystemKind,
	}, FileSystemList)
	if err != nil {
		return false, fmt.Errorf("list Filesystems: %w", err)
	}

	switch len(owned) {
	case 0:
		// No existing Filesystems found, create a new one
		fsName := fsc.Name

		fs := &unstructured.Unstructured{}
		fs.SetGroupVersionKind(schema.GroupVersionKind{
			Group:   FileSystemGroup,
			Version: FileSystemVersion,
			Kind:    FileSystemKind,
		})
		fs.SetName(fsName)

		logger.Info("Creating Filesystem", "name", fsName, "disks", ldNames)
		if err := r.createResourceWithOwnership(ctx, fsc, fs, desiredSpec); err != nil {
			if e := r.handleResourceCreationError(ctx, fsc, "Filesystem", err); e != nil {
				return false, e
			}
			return true, nil
		}

		if _, e := r.updateConditionIfChanged(ctx, fsc, fusionv1alpha1.ConditionTypeFileSystemCreated, metav1.ConditionFalse, ReasonFileSystemCreationInProgress, "Filesystem created; waiting to become Ready"); e != nil {
			return false, e
		}
		return true, nil

	case 1:
		// One existing Filesystem found, check for drift and patch if needed
		fs := &owned[0]
		changed, err := r.detectAndPatchDrift(ctx, fs, func(obj client.Object) bool {
			u := obj.(*unstructured.Unstructured)
			currentSpec, _, _ := unstructured.NestedMap(u.Object, "spec")
			if !reflect.DeepEqual(currentSpec, desiredSpec) {
				u.Object["spec"] = desiredSpec
				return true
			}
			return false
		})
		if err != nil {
			return false, fmt.Errorf("patch Filesystem: %w", err)
		}
		return changed, nil

	default:
		// More than one existing Filesystem found, error out
		msg := fmt.Sprintf("found %d Filesystems owned by FSC; expected 1", len(owned))
		err := fmt.Errorf("%s", msg)
		if e := r.handleResourceCreationError(ctx, fsc, "Filesystem", err); e != nil {
			return false, e
		}
		return true, nil
	}
}

// syncFilesystemConditions updates fusionv1alpha1.ConditionTypeFileSystemCreated by inspecting owned Filesystem objects.
// Keep this conservative: "InProgress" unless we can positively assert success or failure.
func (r *FileSystemClaimReconciler) syncFilesystemConditions(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	logger := log.FromContext(ctx)

	// Do not surface FilesystemCreated at all until LocalDiskCreated is True.
	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeLocalDiskCreated) {
		return false, nil
	}

	owned, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
		Group:   FileSystemGroup,
		Version: FileSystemVersion,
		Kind:    FileSystemKind,
	}, FileSystemList)
	if err != nil {
		return false, fmt.Errorf("list Filesystems: %w", err)
	}

	var desiredStatus metav1.ConditionStatus
	var desiredReason, desiredMsg string

	if len(owned) == 0 {
		desiredStatus = metav1.ConditionFalse
		desiredReason = ReasonFileSystemCreationInProgress
		desiredMsg = "Waiting for Filesystem to be created"
	} else {
		allGood, failingName, failingMsg, _ := r.checkAllResourcesHealthy(owned, []string{"Success", "Healthy"}, nil)

		if allGood {
			desiredStatus = metav1.ConditionTrue
			desiredReason = ReasonFileSystemCreationSucceeded
			desiredMsg = "Filesystem is Success=True and Healthy=True"
		} else {
			desiredStatus = metav1.ConditionFalse
			desiredReason = ReasonFileSystemCreationInProgress
			desiredMsg = fmt.Sprintf("Filesystem %s not healthy: %s", failingName, failingMsg)
		}
	}

	// Update condition if changed
	changed, err := r.updateConditionIfChanged(ctx, fsc, fusionv1alpha1.ConditionTypeFileSystemCreated, desiredStatus, desiredReason, desiredMsg)
	if err != nil {
		return false, err
	}

	if !changed {
		logger.Info("FilesystemCreated condition unchanged; skipping patch")
		// there was no change, so we don't need to requeue
		return false, nil
	}

	logger.Info("synced Filesystem conditions", "fsc", fsc.Name, "owned", len(owned), "status", string(desiredStatus))
	return changed, nil
}

// ensureStorageClass creates StorageClass if it doesn't exist and returns its ready status
func (r *FileSystemClaimReconciler) ensureStorageClass(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	logger := log.FromContext(ctx)

	// Gate on Filesystem being ready
	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeFileSystemCreated) {
		return false, nil
	}

	scName := fsc.Name // Use FSC name directly
	fsName := fsc.Name // the Filesystem name we created

	desired := buildStorageClass(fsc, scName, fsName)

	current := &storagev1.StorageClass{}
	err := r.Get(ctx, types.NamespacedName{Name: scName}, current)
	switch {
	case errors.IsNotFound(err):
		logger.Info("Creating StorageClass", "name", scName, "filesystem", fsName)
		if err := r.Create(ctx, desired.DeepCopy()); err != nil {
			if e := r.handleResourceCreationError(ctx, fsc, "StorageClass", err); e != nil {
				return false, e
			}
			return true, nil
		}

		// mark SC created (idempotent guard)
		changed, err := r.updateConditionIfChanged(ctx, fsc, fusionv1alpha1.ConditionTypeStorageClassCreated, metav1.ConditionTrue, ReasonStorageClassCreationSucceeded, "StorageClass created")
		if err != nil {
			return false, err
		}
		return changed, nil

	case err != nil:
		return false, fmt.Errorf("get StorageClass %q: %w", scName, err)

	default:
		// StorageClass exists - check for drift and patch if needed
		changed, err := r.reconcileExistingStorageClass(ctx, current, desired)
		if err != nil {
			return false, fmt.Errorf("patch StorageClass %q: %w", scName, err)
		}

		// Ensure condition is True (idempotent)
		conditionChanged, err := r.updateConditionIfChanged(ctx, fsc, fusionv1alpha1.ConditionTypeStorageClassCreated, metav1.ConditionTrue, ReasonStorageClassCreationSucceeded, "StorageClass present")
		if err != nil {
			return false, err
		}
		return changed || conditionChanged, nil
	}
}

// syncFSCReady aggregates the overall Ready condition from the sub-conditions.
func (r *FileSystemClaimReconciler) syncFSCReady(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	readyNow := r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeDeviceValidated) &&
		r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeLocalDiskCreated) &&
		r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeFileSystemCreated) &&
		r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeStorageClassCreated)

	var status metav1.ConditionStatus
	var reason, msg string
	if readyNow {
		status, reason, msg = metav1.ConditionTrue, ReasonProvisioningSucceeded, "All resources created and ready"
	} else {
		status, reason, msg = metav1.ConditionFalse, ReasonProvisioningInProgress, "Provisioning in progress"
	}

	return r.updateConditionIfChanged(ctx, fsc, fusionv1alpha1.ConditionTypeReady, status, reason, msg)
}

// Handlers for FileSystemClaim reconciliation -- END

// Helper functions -- START

// mapKeysToSlice converts map keys to a sorted slice for deterministic output
func mapKeysToSlice(m map[string]struct{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

// hasConditionWithReason checks if a condition exists with the given type and reason
func (r *FileSystemClaimReconciler) hasConditionWithReason(conds []metav1.Condition, condType, reason string) bool {
	cond := apimeta.FindStatusCondition(conds, condType)
	return cond != nil && cond.Reason == reason
}

// calculateDeletionBackoff calculates exponential backoff for deletion retries
// Returns the duration to wait before requeueing based on how long the condition has been blocked
func (r *FileSystemClaimReconciler) calculateDeletionBackoff(fsc *fusionv1alpha1.FileSystemClaim, reason string) time.Duration {
	const (
		initialDelay = 30 * time.Second
		maxDelay     = 10 * time.Minute
	)

	cond := apimeta.FindStatusCondition(fsc.Status.Conditions, fusionv1alpha1.ConditionTypeDeletionBlocked)
	if cond == nil || cond.Reason != reason {
		// First time seeing this blocker, start with initial delay
		return initialDelay
	}

	// Calculate time since the condition was last transitioned to this reason
	elapsed := time.Since(cond.LastTransitionTime.Time)

	// Exponential backoff: 30s, 1m, 2m, 4m, 8m, max 10m
	const (
		oneMinute      = 1 * time.Minute
		twoMinutes     = 2 * time.Minute
		threeMinutes   = 3 * time.Minute
		fourMinutes    = 4 * time.Minute
		sevenMinutes   = 7 * time.Minute
		eightMinutes   = 8 * time.Minute
		fifteenMinutes = 15 * time.Minute
	)

	switch {
	case elapsed < initialDelay:
		return initialDelay
	case elapsed < oneMinute:
		return oneMinute
	case elapsed < threeMinutes:
		return twoMinutes
	case elapsed < sevenMinutes:
		return fourMinutes
	case elapsed < fifteenMinutes:
		return eightMinutes
	default:
		return maxDelay
	}
}

// convert unstructured.Slice to metav1.Condition
func asMetaConditions(sl []any) []metav1.Condition {
	out := make([]metav1.Condition, 0, len(sl))
	for _, it := range sl {
		m, ok := it.(map[string]any)
		if !ok {
			continue
		}
		var c metav1.Condition
		if v, _, _ := unstructured.NestedString(m, "type"); v != "" {
			c.Type = v
		}
		if v, _, _ := unstructured.NestedString(m, "status"); v != "" {
			c.Status = metav1.ConditionStatus(v)
		}
		if v, _, _ := unstructured.NestedString(m, "reason"); v != "" {
			c.Reason = v
		}
		if v, _, _ := unstructured.NestedString(m, "message"); v != "" {
			c.Message = v
		}
		if v, _, _ := unstructured.NestedString(m, "lastTransitionTime"); v != "" {
			if t, err := time.Parse(time.RFC3339, v); err == nil {
				c.LastTransitionTime = metav1.NewTime(t)
			}
		}
		out = append(out, c)
	}
	return out
}

// patchFSCStatus safely patches status with retry-on-conflict.
func (r *FileSystemClaimReconciler) patchFSCStatus(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim, mutate func(*fusionv1alpha1.FileSystemClaim)) error {
	return retry.RetryOnConflict(retry.DefaultRetry, func() error {
		// refetch latest to get fresh resourceVersion
		cur := &fusionv1alpha1.FileSystemClaim{}
		if err := r.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, cur); err != nil {
			return err
		}
		orig := cur.DeepCopy()
		mutate(cur)
		return r.Status().Patch(ctx, cur, client.MergeFrom(orig))
	})
}

// patchFSC safely patches metadata and spec updates with retry-on-conflict.
func (r *FileSystemClaimReconciler) patchFSCSpec(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim, mutate func(*fusionv1alpha1.FileSystemClaim)) error {
	return retry.RetryOnConflict(retry.DefaultRetry, func() error {
		cur := &fusionv1alpha1.FileSystemClaim{}
		if err := r.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, cur); err != nil {
			return err
		}
		orig := cur.DeepCopy()
		mutate(cur)
		return r.Patch(ctx, cur, client.MergeFrom(orig))
	})
}

// isOwnedByThisFSC returns true if obj has an OwnerReference to the given FSC name
// (Kind/APIVersion match; Controller bit not required).
func isOwnedByThisFSC(obj client.Object, fscName string) bool {
	for _, or := range obj.GetOwnerReferences() {
		if or.Kind == FileSystemClaimKind &&
			or.APIVersion == "fusion.storage.openshift.io/v1alpha1" &&
			or.Name == fscName {
			return true
		}
	}
	return false
}

// isConditionTrue checks if a condition is true in the FileSystemClaim status
func (r *FileSystemClaimReconciler) isConditionTrue(fsc *fusionv1alpha1.FileSystemClaim, conditionType string) bool {
	for _, condition := range fsc.Status.Conditions {
		if condition.Type == conditionType && condition.Status == metav1.ConditionTrue {
			return true
		}
	}
	return false
}

// getRandomStorageNode returns a random node name that has both
// WorkerNodeRoleLabel and ScaleStorageRoleLabel=ScaleStorageRoleValue labels
func (r *FileSystemClaimReconciler) getRandomStorageNode(ctx context.Context) (string, error) {
	logger := log.FromContext(ctx)

	allNodes := &metav1.PartialObjectMetadataList{}
	allNodes.SetGroupVersionKind(corev1.SchemeGroupVersion.WithKind("NodeList"))

	// List all nodes
	err := r.List(ctx, allNodes)
	if err != nil {
		return "", fmt.Errorf("failed to list nodes: %w", err)
	}

	// Filter nodes with both worker and storage labels
	var storageNodes []string
	for i := range allNodes.Items {
		node := &allNodes.Items[i]
		labels := node.GetLabels()
		_, hasWorkerLabel := labels[WorkerNodeRoleLabel]
		hasStorageLabel := labels[ScaleStorageRoleLabel] == ScaleStorageRoleValue

		if hasWorkerLabel && hasStorageLabel {
			storageNodes = append(storageNodes, node.Name)
		}
	}

	if len(storageNodes) == 0 {
		return "", fmt.Errorf("no nodes found with both %s and %s=%s labels",
			WorkerNodeRoleLabel, ScaleStorageRoleLabel, ScaleStorageRoleValue)
	}

	// Return random node
	idx, err := cryptorand.Int(cryptorand.Reader, big.NewInt(int64(len(storageNodes))))
	if err != nil {
		return "", fmt.Errorf("failed to select random storage node: %w", err)
	}
	selectedNode := storageNodes[idx.Int64()]

	logger.Info("Selected random storage node", "node", selectedNode, "totalStorageNodes", len(storageNodes))
	return selectedNode, nil
}

// validateDevices checks if the specified devices are present in ALL LocalVolumeDiscoveryResult
// which ensures both the device is valid and shared across all nodes.
// When this function is called.
// return a human readable error message.
func (r *FileSystemClaimReconciler) validateDevices(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) error {
	logger := log.FromContext(ctx)

	allNodes := &metav1.PartialObjectMetadataList{}
	allNodes.SetGroupVersionKind(corev1.SchemeGroupVersion.WithKind("NodeList"))

	// List all nodes
	err := r.List(ctx, allNodes)
	if err != nil {
		return fmt.Errorf("failed to list nodes: %w", err)
	}

	lvdrs := make(map[string]*fusionv1alpha1.LocalVolumeDiscoveryResult)
	for i := range allNodes.Items {
		node := &allNodes.Items[i]
		labels := node.GetLabels()
		_, hasWorkerLabel := labels[WorkerNodeRoleLabel]
		hasStorageLabel := labels[ScaleStorageRoleLabel] == ScaleStorageRoleValue

		// Filter nodes with both worker and storage labels
		if hasWorkerLabel && hasStorageLabel {
			lvdrName := fmt.Sprintf("discovery-result-%s", node.Name)
			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{}

			// Get the LVDR for the node (LVDRs are in the operator's namespace)
			operatorNamespace, err := utils.GetDeploymentNamespace()
			if err != nil {
				return fmt.Errorf("failed to get operator deployment namespace: %w", err)
			}

			err = r.Get(ctx, types.NamespacedName{
				Name:      lvdrName,
				Namespace: operatorNamespace,
			}, lvdr)

			if err != nil {
				if errors.IsNotFound(err) {
					return fmt.Errorf("LocalVolumeDiscoveryResult: %s not found for node: %s", lvdrName, node.Name)
				}
				return fmt.Errorf("failed to get LocalVolumeDiscoveryResult for node %s: %w", node.Name, err)
			}

			lvdrs[node.Name] = lvdr
		}
	}

	if len(lvdrs) == 0 {
		return fmt.Errorf("no nodes found with both %s and %s=%s labels", WorkerNodeRoleLabel, ScaleStorageRoleLabel, ScaleStorageRoleValue)
	}

	// For each device, check if it exists in ALL LVDRs
	for _, device := range fsc.Spec.Devices {
		for nodeName, lvdr := range lvdrs {
			// Check if DiscoveredDevices exists and is not empty
			if len(lvdr.Status.DiscoveredDevices) == 0 {
				return fmt.Errorf("no discovered devices available for node %s. "+
					"Device: %s may be in use in another filesystem or is not "+
					"shared across all nodes", nodeName, device)
			}

			deviceFound := false
			for _, discoveredDevice := range lvdr.Status.DiscoveredDevices {
				if discoveredDevice.Path == device {
					deviceFound = true
					break
				}
			}

			if !deviceFound {
				return fmt.Errorf("device %s not found in LocalVolumeDiscoveryResult for node %s", device, nodeName)
			}
		}

		logger.Info("Device validation successful", "device", device, "availableOnAllNodesWithWorkerAndstorageLabel", len(lvdrs))
	}

	return nil
}

// getDeviceWWN looks up the WWN for a device path from LocalVolumeDiscoveryResult
func (r *FileSystemClaimReconciler) getDeviceWWN(
	ctx context.Context,
	devicePath string,
	nodeName string,
) (string, error) {
	logger := log.FromContext(ctx)

	// Get the operator namespace
	operatorNamespace, err := utils.GetDeploymentNamespace()
	if err != nil {
		return "", fmt.Errorf("failed to get operator deployment namespace: %w", err)
	}

	// Construct LVDR name
	lvdrName := fmt.Sprintf("discovery-result-%s", nodeName)

	// Get the LVDR for the node
	lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{}
	err = r.Get(ctx, types.NamespacedName{
		Name:      lvdrName,
		Namespace: operatorNamespace,
	}, lvdr)

	if err != nil {
		if errors.IsNotFound(err) {
			return "", fmt.Errorf("LocalVolumeDiscoveryResult %s not found for node %s", lvdrName, nodeName)
		}
		return "", fmt.Errorf("failed to get LocalVolumeDiscoveryResult for node %s: %w", nodeName, err)
	}

	// Search for the device in DiscoveredDevices
	for _, device := range lvdr.Status.DiscoveredDevices {
		if device.Path == devicePath {
			if device.WWN == "" {
				return "", fmt.Errorf("device %s found but WWN is empty", devicePath)
			}
			logger.Info("Found WWN for device", "device", devicePath, "wwn", device.WWN, "node", nodeName)
			return device.WWN, nil
		}
	}

	return "", fmt.Errorf("device %s not found in LocalVolumeDiscoveryResult for node %s", devicePath, nodeName)
}

// generateLocalDiskName generates a LocalDisk name from WWN
// Uses the raw WWN directly to match v1.0 naming convention
func generateLocalDiskName(wwn string) (string, error) {
	// Validate WWN is not empty
	if wwn == "" {
		return "", fmt.Errorf("WWN cannot be empty")
	}

	// Validate Kubernetes resource name constraints
	if len(wwn) > maxKubernetesNameLength {
		return "", fmt.Errorf("WWN too long for Kubernetes resource name: %s (max %d chars)", wwn, maxKubernetesNameLength)
	}

	// Basic validation for Kubernetes resource names
	if !isValidKubernetesName(wwn) {
		return "", fmt.Errorf("WWN is not a valid Kubernetes resource name: %s", wwn)
	}

	return wwn, nil
}

// isValidKubernetesName checks if a string is a valid Kubernetes resource name
func isValidKubernetesName(name string) bool {
	if name == "" || len(name) > maxKubernetesNameLength {
		return false
	}

	// Must start and end with alphanumeric character
	first, _ := utf8.DecodeRuneInString(name)
	last, _ := utf8.DecodeLastRuneInString(name)
	if !isAlphanumeric(first) || !isAlphanumeric(last) {
		return false
	}

	// Can contain alphanumeric characters, hyphens, and dots
	for _, char := range name {
		if !isAlphanumeric(char) && char != '-' && char != '.' {
			return false
		}
	}

	return true
}

// isAlphanumeric checks if a character is alphanumeric
func isAlphanumeric(char rune) bool {
	return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9')
}

// listOwnedResources lists all resources of a given GVK owned by the FSC
func (r *FileSystemClaimReconciler) listOwnedResources(
	ctx context.Context,
	fsc *fusionv1alpha1.FileSystemClaim,
	gvk schema.GroupVersionKind,
	listKind string,
) ([]unstructured.Unstructured, error) {
	resourceList := &unstructured.UnstructuredList{}
	resourceList.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   gvk.Group,
		Version: gvk.Version,
		Kind:    listKind,
	})

	if err := r.List(ctx, resourceList, client.InNamespace(fsc.Namespace)); err != nil {
		return nil, fmt.Errorf("list %s: %w", listKind, err)
	}

	var owned []unstructured.Unstructured
	for _, item := range resourceList.Items {
		if isOwnedByThisFSC(&item, fsc.Name) {
			owned = append(owned, item)
		}
	}

	return owned, nil
}

// updateConditionIfChanged updates a condition only if status/reason/message changed
func (r *FileSystemClaimReconciler) updateConditionIfChanged(
	ctx context.Context,
	fsc *fusionv1alpha1.FileSystemClaim,
	conditionType string,
	status metav1.ConditionStatus,
	reason string,
	message string,
) (bool, error) {
	// Check if condition already has the desired state
	prev := apimeta.FindStatusCondition(fsc.Status.Conditions, conditionType)
	if prev != nil && prev.Status == status && prev.Reason == reason && prev.Message == message {
		return false, nil
	}

	// Preserve migration status - don't overwrite conditions set during migration
	// This keeps the audit trail showing resources were migrated from v1.0
	if prev != nil && prev.Reason == MigrationReasonComplete && status == metav1.ConditionTrue {
		// Condition is already True with MigrationComplete reason, keep it
		return false, nil
	}

	// Update the condition
	if err := r.patchFSCStatus(ctx, fsc, func(cur *fusionv1alpha1.FileSystemClaim) {
		cur.Status.Conditions = utils.UpdateCondition(
			cur.Status.Conditions,
			conditionType,
			status,
			reason,
			message,
			cur.Generation,
		)
	}); err != nil {
		return false, err
	}

	return true, nil
}

// handleResourceCreationError updates both resource-specific and Ready conditions on creation errors
func (r *FileSystemClaimReconciler) handleResourceCreationError(
	ctx context.Context,
	fsc *fusionv1alpha1.FileSystemClaim,
	resourceType string,
	err error,
) error {
	var conditionType string
	var reason string

	switch resourceType {
	case "LocalDisk":
		conditionType = fusionv1alpha1.ConditionTypeLocalDiskCreated
		reason = ReasonLocalDiskCreationFailed
	case "Filesystem":
		conditionType = fusionv1alpha1.ConditionTypeFileSystemCreated
		reason = ReasonFileSystemCreationFailed
	case "StorageClass":
		conditionType = fusionv1alpha1.ConditionTypeStorageClassCreated
		reason = ReasonStorageClassCreationFailed
	default:
		return fmt.Errorf("unknown resource type: %s", resourceType)
	}

	// Update Ready condition first, then resource-specific condition
	if e := r.patchFSCStatus(ctx, fsc, func(cur *fusionv1alpha1.FileSystemClaim) {
		cur.Status.Conditions = utils.UpdateCondition(
			cur.Status.Conditions,
			conditionType,
			metav1.ConditionFalse,
			reason,
			err.Error(),
			cur.Generation,
		)
		cur.Status.Conditions = utils.UpdateCondition(
			cur.Status.Conditions,
			fusionv1alpha1.ConditionTypeReady,
			metav1.ConditionFalse,
			ReasonProvisioningFailed,
			fmt.Sprintf("%s creation failed", resourceType),
			cur.Generation,
		)
	}); e != nil {
		return e
	}

	return nil
}

// extractResourceConditions extracts and converts status.conditions from unstructured objects
func extractResourceConditions(obj *unstructured.Unstructured) ([]metav1.Condition, error) {
	sl, found, _ := unstructured.NestedSlice(obj.Object, "status", "conditions")
	if !found {
		return nil, fmt.Errorf("status.conditions missing")
	}
	return asMetaConditions(sl), nil
}

// checkResourceCondition checks if a condition exists and matches expected status
func checkResourceCondition(
	conds []metav1.Condition,
	conditionType string,
	expectedStatus metav1.ConditionStatus,
) (matched bool, message string) {
	condition := apimeta.FindStatusCondition(conds, conditionType)
	if condition == nil {
		return false, fmt.Sprintf("%s condition not found", conditionType)
	}
	if condition.Status != expectedStatus {
		return false, condition.Message
	}
	return true, ""
}

// checkAllResourcesHealthy validates that all resources meet health criteria
func (r *FileSystemClaimReconciler) checkAllResourcesHealthy(
	resources []unstructured.Unstructured,
	requiredConditions []string,
	ownedFilesystems map[string]struct{},
) (allHealthy bool, failingName, failingMsg string, hardFailure bool) {
	for _, resource := range resources {
		conds, err := extractResourceConditions(&resource)
		if err != nil {
			return false, resource.GetName(), err.Error(), false
		}

		// Check all required conditions
		for _, conditionType := range requiredConditions {
			switch conditionType {
			case "Ready":
				if isMatch, msg := checkResourceCondition(conds, "Ready", metav1.ConditionTrue); !isMatch {
					return false, resource.GetName(), msg, false
				}
			case "Used":
				// Special handling for Used condition
				usedCondition := apimeta.FindStatusCondition(conds, "Used")
				if usedCondition == nil {
					return false, resource.GetName(), "Used condition not found", false
				}
				if usedCondition.Status == metav1.ConditionTrue {
					// Check if used by our filesystem
					fsName, _, _ := unstructured.NestedString(resource.Object, "status", "filesystem")
					if _, ok := ownedFilesystems[fsName]; !ok || fsName == "" {
						if fsName == "" {
							return false, resource.GetName(), "LocalDisk is used but status.filesystem is empty or missing", true
						}
						return false, resource.GetName(), fmt.Sprintf("LocalDisk is used by different filesystem %q", fsName), true
					}
				}
			case "Success":
				if isMatch, msg := checkResourceCondition(conds, "Success", metav1.ConditionTrue); !isMatch {
					return false, resource.GetName(), msg, false
				}
			case "Healthy":
				if isMatch, msg := checkResourceCondition(conds, "Healthy", metav1.ConditionTrue); !isMatch {
					return false, resource.GetName(), msg, false
				}
			}
		}
	}

	return true, "", "", false
}

// createResourceWithOwnership creates a resource with owner reference in one call
// helps creating LocalDisk or Filesystem
func (r *FileSystemClaimReconciler) createResourceWithOwnership(
	ctx context.Context,
	fsc *fusionv1alpha1.FileSystemClaim,
	obj *unstructured.Unstructured,
	spec map[string]any,
) error {
	obj.SetNamespace(fsc.Namespace)
	if err := controllerutil.SetOwnerReference(fsc, obj, r.Scheme); err != nil {
		return fmt.Errorf("set ownerRef: %w", err)
	}
	// Stamp consistent ownership labels for reconciliation/watch filtering
	labels := obj.GetLabels()
	if labels == nil {
		labels = map[string]string{}
	}
	labels[FileSystemClaimOwnedByNameLabel] = fsc.Name
	labels[FileSystemClaimOwnedByNamespaceLabel] = fsc.Namespace
	obj.SetLabels(labels)
	if obj.Object == nil {
		obj.Object = map[string]any{}
	}
	obj.Object["spec"] = spec
	return r.Create(ctx, obj)
}

// detectAndPatchDrift performs generic drift detection and patching
func (r *FileSystemClaimReconciler) detectAndPatchDrift(
	ctx context.Context,
	current client.Object,
	updateFunc func(client.Object) bool,
) (bool, error) {
	orig := current.DeepCopyObject().(client.Object)
	changed := updateFunc(current)

	if !changed {
		return false, nil
	}

	if err := r.Patch(ctx, current, client.MergeFrom(orig)); err != nil {
		return false, fmt.Errorf("patch resource: %w", err)
	}

	return true, nil
}

// handleValidationError updates both Ready and DeviceValidated conditions for validation errors
func (r *FileSystemClaimReconciler) handleValidationError(
	ctx context.Context,
	fsc *fusionv1alpha1.FileSystemClaim,
	err error,
) error {
	return r.patchFSCStatus(ctx, fsc, func(cur *fusionv1alpha1.FileSystemClaim) {
		cur.Status.Conditions = utils.UpdateCondition(
			cur.Status.Conditions, fusionv1alpha1.ConditionTypeReady,
			metav1.ConditionFalse, ReasonValidationFailed, err.Error(), cur.Generation,
		)
		cur.Status.Conditions = utils.UpdateCondition(
			cur.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated,
			metav1.ConditionFalse, ReasonDeviceValidationFailed, err.Error(), cur.Generation,
		)
	})
}

// buildFilesystemSpec constructs the standard Filesystem spec structure
func buildFilesystemSpec(ldNames []string) map[string]any {
	toIface := func(ss []string) []any {
		out := make([]any, len(ss))
		for i, s := range ss {
			out[i] = s
		}
		return out
	}

	return map[string]any{
		"local": map[string]any{
			"blockSize": "4M",
			"pools": []any{
				map[string]any{
					"name":  "system",
					"disks": toIface(ldNames),
				},
			},
			"replication": "1-way",
			"type":        "shared",
		},
		"seLinuxOptions": map[string]any{
			"level": "s0",
			"role":  "object_r",
			"type":  "container_file_t",
			"user":  "system_u",
		},
	}
}

func buildStorageClass(fsc *fusionv1alpha1.FileSystemClaim, scName, fsName string) *storagev1.StorageClass {
	return &storagev1.StorageClass{
		ObjectMeta: metav1.ObjectMeta{
			Name: scName,
			Annotations: map[string]string{
				StorageClassDefaultAnnotation: "true",
			},
			Labels: map[string]string{
				FileSystemClaimOwnedByNameLabel:      fsc.Name,
				FileSystemClaimOwnedByNamespaceLabel: fsc.Namespace,
			},
		},
		Provisioner:          "spectrumscale.csi.ibm.com",
		AllowVolumeExpansion: ptr.To(true),
		ReclaimPolicy:        ptr.To(corev1.PersistentVolumeReclaimDelete),
		VolumeBindingMode:    ptr.To(storagev1.VolumeBindingImmediate),
		Parameters: map[string]string{
			"volBackendFs": fsName,
		},
	}
}

func storageClassRelevantFields(sc *storagev1.StorageClass) *storagev1.StorageClass {
	return &storagev1.StorageClass{
		ObjectMeta: metav1.ObjectMeta{
			Annotations: sc.Annotations,
			Labels:      sc.Labels,
		},
		Provisioner:          sc.Provisioner,
		AllowVolumeExpansion: sc.AllowVolumeExpansion,
		ReclaimPolicy:        sc.ReclaimPolicy,
		VolumeBindingMode:    sc.VolumeBindingMode,
		Parameters:           sc.Parameters,
	}
}

func (r *FileSystemClaimReconciler) reconcileExistingStorageClass(
	ctx context.Context,
	current *storagev1.StorageClass,
	desired *storagev1.StorageClass,
) (bool, error) {
	logger := log.FromContext(ctx)
	return r.detectAndPatchDrift(ctx, current, func(obj client.Object) bool {
		sc := obj.(*storagev1.StorageClass)
		if reflect.DeepEqual(storageClassRelevantFields(sc), storageClassRelevantFields(desired)) {
			return false
		}

		fields := storageClassRelevantFields(desired)
		sc.Annotations = fields.Annotations
		sc.Provisioner = fields.Provisioner
		sc.AllowVolumeExpansion = fields.AllowVolumeExpansion
		sc.ReclaimPolicy = fields.ReclaimPolicy
		sc.VolumeBindingMode = fields.VolumeBindingMode
		sc.Parameters = fields.Parameters
		sc.Labels = fields.Labels
		logger.Info("Detected StorageClass drift; patching to desired state", "name", sc.Name)
		return true
	})
}

func (r *FileSystemClaimReconciler) isStorageClassInUse(
	ctx context.Context,
	fsc *fusionv1alpha1.FileSystemClaim,
) (inUse bool, who string, err error) {
	logger := log.FromContext(ctx)

	scName := fsc.Name

	var pvList corev1.PersistentVolumeList
	if err := r.List(ctx, &pvList); errors.IsNotFound(err) {
		// No PVs found, so SC is not in use
		return false, "", nil
	} else if err != nil {
		logger.Error(err, "Failed to list PVs")
		return false, "", err
	}

	var offendingPV []string
	for i := range pvList.Items {
		pv := &pvList.Items[i]

		// Match only the SC we're interested in
		if pv.Spec.StorageClassName != scName {
			continue
		}
		// Deleting PVs don't block
		if pv.DeletionTimestamp != nil {
			continue
		}

		// Check if the PV is bound to a PVC
		switch pv.Status.Phase {
		case corev1.VolumeBound:
			offendingPV = append(offendingPV, fmt.Sprintf("pv%s (BOUND)", pv.Name))
		case corev1.VolumeReleased:
			offendingPV = append(offendingPV, fmt.Sprintf("pv%s (RELEASED)", pv.Name))
		default:
			logger.Info("Unexpected PV phase", "name", pv.Name, "phase", pv.Status.Phase)
		}
	}

	if len(offendingPV) > 0 {
		const maxShow = 5
		if len(offendingPV) > maxShow {
			offendingPV = append(offendingPV[:maxShow], fmt.Sprintf("... and %d more", len(offendingPV)-maxShow))
		}
		who := "blocked because of the following PVs: " + strings.Join(offendingPV, ", ")
		logger.Info("StorageClass is in use", "name", scName, "who", who)

		return true, who, nil
	}
	return false, "", nil
}

// markDeletionRequested sets Ready=False with ReasonDeletionRequested
func (r *FileSystemClaimReconciler) markDeletionRequested(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	if !r.hasConditionWithReason(fsc.Status.Conditions, fusionv1alpha1.ConditionTypeReady, ReasonDeletionRequested) {
		changed, err := r.updateConditionIfChanged(ctx, fsc,
			fusionv1alpha1.ConditionTypeReady,
			metav1.ConditionFalse,
			ReasonDeletionRequested,
			"FileSystemClaim deletion was requested, proceeding with cleanup in this order: StorageClass, Filesystem, LocalDisk")
		if err != nil {
			return false, err
		}
		if changed {
			log.FromContext(ctx).Info("Set Ready=False for deletion")
			return true, nil
		}
	}
	return false, nil
}

// checkStorageClassUsage checks if SC is in use and blocks if needed
func (r *FileSystemClaimReconciler) checkStorageClassUsage(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (time.Duration, bool, error) {
	logger := log.FromContext(ctx)

	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeStorageClassCreated) {
		return 0, false, nil // Already deleted
	}

	inUse, who, err := r.isStorageClassInUse(ctx, fsc)
	if err != nil {
		return 0, false, err
	}

	if inUse {
		changed, e := r.updateConditionIfChanged(ctx, fsc,
			fusionv1alpha1.ConditionTypeDeletionBlocked,
			metav1.ConditionTrue,
			ReasonStorageClassInUse,
			who)
		if e != nil {
			return 0, false, e
		}
		requeueAfter := r.calculateDeletionBackoff(fsc, ReasonStorageClassInUse)
		logger.Info("StorageClass is in use, blocking deletion", "name", fsc.Name, "who", who, "requeueAfter", requeueAfter)
		return requeueAfter, changed, nil
	}

	logger.Info("StorageClass no longer in use, moving to next step")
	return 0, false, nil
}

// checkFilesystemDeletionLabel checks if FS has deletion label and blocks if missing
func (r *FileSystemClaimReconciler) checkFilesystemDeletionLabel(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (time.Duration, bool, error) {
	logger := log.FromContext(ctx)

	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeFileSystemCreated) {
		return 0, false, nil // Already deleted
	}

	fsList, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
		Group:   FileSystemGroup,
		Version: FileSystemVersion,
		Kind:    FileSystemKind,
	}, FileSystemList)
	if err != nil {
		return 0, false, err
	}

	if len(fsList) > 1 {
		return 0, false, fmt.Errorf("multiple Filesystems found for FSC %s", fsc.Name)
	}

	if len(fsList) > 0 {
		fs := &fsList[0]
		fslabels := fs.GetLabels()
		if _, ok := fslabels[FileSystemDeletionLabel]; !ok {
			msg := fmt.Sprintf("WARNING: Deleting the filesystem resource will result in loss of data. "+
				"To confirm this action, please label the filesystem (%s) with scale.spectrum.ibm.com/allowDelete and try again.",
				fs.GetName())
			changed, e := r.updateConditionIfChanged(ctx, fsc,
				fusionv1alpha1.ConditionTypeDeletionBlocked,
				metav1.ConditionTrue,
				ReasonFileSystemLabelNotPresent,
				msg,
			)
			if e != nil {
				return 0, false, e
			}
			requeueAfter := r.calculateDeletionBackoff(fsc, ReasonFileSystemLabelNotPresent)
			logger.Info("Filesystem deletion label not present, blocking deletion",
				"filesystem", fs.GetName(), "requeueAfter", requeueAfter)
			return requeueAfter, changed, nil
		}
	}

	logger.Info("Filesystem deletion label present, moving to next step")
	return 0, false, nil
}

// deleteStorageClass deletes the StorageClass and marks progress
func (r *FileSystemClaimReconciler) deleteStorageClass(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	logger := log.FromContext(ctx)

	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeStorageClassCreated) {
		return false, nil // Already deleted
	}

	scName := fsc.Name
	sc := &storagev1.StorageClass{}
	if err := r.Get(ctx, types.NamespacedName{Name: scName}, sc); err == nil {
		if err := r.Delete(ctx, sc); err != nil {
			logger.Error(err, "Failed to delete StorageClass")
			return false, err
		}
		logger.Info("Deleted StorageClass", "name", scName)
		return true, nil
	} else if !errors.IsNotFound(err) {
		return false, err
	}

	// Mark as deleted
	changed, err := r.updateConditionIfChanged(ctx, fsc,
		fusionv1alpha1.ConditionTypeStorageClassCreated,
		metav1.ConditionFalse,
		ReasonStorageClassDeleted,
		"StorageClass deleted, proceeding with Filesystem deletion")
	if err != nil {
		return false, err
	}
	if changed {
		logger.Info("StorageClass deletion complete")
	}
	return changed, nil
}

// deleteFilesystem deletes the Filesystem and marks progress
func (r *FileSystemClaimReconciler) deleteFilesystem(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (time.Duration, bool, error) {
	const filesystemDeletionWait = 45 * time.Second

	logger := log.FromContext(ctx)

	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeFileSystemCreated) {
		return 0, false, nil // Already deleted
	}

	fsList, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
		Group:   FileSystemGroup,
		Version: FileSystemVersion,
		Kind:    FileSystemKind,
	}, FileSystemList)
	if err != nil {
		return 0, false, err
	}

	if len(fsList) > 0 {
		fs := &fsList[0]
		if err := r.Delete(ctx, fs); err != nil {
			logger.Error(err, "Failed to delete Filesystem")
			return 0, false, err
		}
		logger.Info("Deleted Filesystem", "name", fs.GetName())
		return filesystemDeletionWait, true, nil
	}

	// Mark as deleted
	changed, err := r.updateConditionIfChanged(ctx, fsc,
		fusionv1alpha1.ConditionTypeFileSystemCreated,
		metav1.ConditionFalse,
		ReasonFilesystemDeleted,
		"Filesystem deleted, proceeding with LocalDisk deletion")
	if err != nil {
		return 0, false, err
	}
	if changed {
		logger.Info("Filesystem deletion complete")
		return 0, true, nil
	}
	return 0, false, nil
}

// deleteLocalDisks deletes all LocalDisks and marks progress
func (r *FileSystemClaimReconciler) deleteLocalDisks(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (time.Duration, bool, error) {
	const localDiskDeletionWait = 30 * time.Second

	logger := log.FromContext(ctx)

	if !r.isConditionTrue(fsc, fusionv1alpha1.ConditionTypeLocalDiskCreated) {
		return 0, false, nil // Already deleted
	}

	ldList, err := r.listOwnedResources(ctx, fsc, schema.GroupVersionKind{
		Group:   LocalDiskGroup,
		Version: LocalDiskVersion,
		Kind:    LocalDiskKind,
	}, LocalDiskList)
	if err != nil {
		return 0, false, err
	}

	if len(ldList) > 0 {
		for i := range ldList {
			ld := &ldList[i]
			if err := r.Delete(ctx, ld); err != nil {
				logger.Error(err, "Failed to delete LocalDisk", "name", ld.GetName())
				return 0, false, err
			}
			logger.Info("Deleted LocalDisk", "name", ld.GetName())
		}
		return localDiskDeletionWait, true, nil
	}

	// Mark as deleted
	changed, err := r.updateConditionIfChanged(ctx, fsc,
		fusionv1alpha1.ConditionTypeLocalDiskCreated,
		metav1.ConditionFalse,
		ReasonLocalDiskDeleted,
		"LocalDisks deleted, proceeding with finalizer removal")
	if err != nil {
		return 0, false, err
	}
	if changed {
		logger.Info("LocalDisk deletion complete")
		return 0, true, nil
	}
	return 0, false, nil
}

// removeFinalizer removes the finalizer from FSC
func (r *FileSystemClaimReconciler) removeFinalizer(ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (bool, error) {
	logger := log.FromContext(ctx)

	if err := r.patchFSCSpec(ctx, fsc, func(cur *fusionv1alpha1.FileSystemClaim) {
		controllerutil.RemoveFinalizer(cur, FileSystemClaimFinalizer)
	}); err != nil {
		logger.Error(err, "Failed to remove finalizer")
		return false, err
	}
	logger.Info("Removed finalizer, FileSystemClaim will be deleted", "name", fsc.Name)
	return true, nil
}

// Helper functions -- END

// Handlers for watched resources -- START

func enqueueFSCByOwner() handler.EventHandler {
	return handler.EnqueueRequestsFromMapFunc(func(_ context.Context, obj client.Object) []reconcile.Request {
		gvk := fusionv1alpha1.GroupVersion.WithKind("FileSystemClaim")
		owners := obj.GetOwnerReferences()
		for _, o := range owners {
			if o.APIVersion == gvk.GroupVersion().String() && o.Kind == gvk.Kind {
				// LocalDisk and Filesystem are namespaced; owner lives in the same namespace.
				return []reconcile.Request{{
					NamespacedName: types.NamespacedName{
						Namespace: obj.GetNamespace(),
						Name:      o.Name,
					},
				}}
			}
		}
		return nil
	})
}

func didStorageClassChange() builder.WatchesOption {
	return builder.WithPredicates(predicate.Funcs{
		CreateFunc: func(_ event.CreateEvent) bool {
			return false
		},
		UpdateFunc: func(e event.UpdateEvent) bool {
			if e.ObjectNew == nil {
				return false
			}
			labels := e.ObjectNew.GetLabels()
			if labels == nil {
				return false
			}
			return labels[FileSystemClaimOwnedByNameLabel] != "" && labels[FileSystemClaimOwnedByNamespaceLabel] != ""
		},
		DeleteFunc: func(e event.DeleteEvent) bool {
			if e.Object == nil {
				return false
			}
			labels := e.Object.GetLabels()
			if labels == nil {
				return false
			}
			return labels[FileSystemClaimOwnedByNameLabel] != "" && labels[FileSystemClaimOwnedByNamespaceLabel] != ""
		},
		GenericFunc: func(_ event.GenericEvent) bool {
			return false
		},
	})
}

func enqueueFSCByStorageClass() handler.EventHandler {
	return handler.EnqueueRequestsFromMapFunc(func(_ context.Context, obj client.Object) []reconcile.Request {
		labels := obj.GetLabels()
		name := labels[FileSystemClaimOwnedByNameLabel]
		namespace := labels[FileSystemClaimOwnedByNamespaceLabel]
		if name == "" || namespace == "" {
			return nil
		}

		return []reconcile.Request{{
			NamespacedName: types.NamespacedName{
				Namespace: namespace,
				Name:      name,
			},
		}}
	})
}

// isInTargetNamespace checks if the resource is in the ibm-spectrum-scale namespace
func isInTargetNamespace(obj client.Object) bool {
	return obj.GetNamespace() == "ibm-spectrum-scale"
}

// isOwnedByFileSystemClaim checks if the resource is owned by a FileSystemClaim
func isOwnedByFileSystemClaim(obj client.Object) bool {
	ownerRefs := obj.GetOwnerReferences()
	for _, ownerRef := range ownerRefs {
		if ownerRef.Kind == "FileSystemClaim" &&
			ownerRef.APIVersion == "fusion.storage.openshift.io/v1alpha1" {
			return true
		}
	}
	return false
}

// didResourceStatusChange returns true if the LocalDisk or FileSystem status has changed
func didResourceStatusChange() builder.WatchesOption {
	return builder.WithPredicates(predicate.Funcs{
		CreateFunc: func(_ event.CreateEvent) bool {
			return false
		},
		UpdateFunc: func(e event.UpdateEvent) bool {
			if !isInTargetNamespace(e.ObjectNew) || !isOwnedByFileSystemClaim(e.ObjectNew) {
				return false
			}

			oldObj, okOld := e.ObjectOld.(*unstructured.Unstructured)
			newObj, okNew := e.ObjectNew.(*unstructured.Unstructured)
			if !okOld || !okNew {
				return false
			}

			oldStatus, oldHas := oldObj.Object["status"]
			newStatus, newHas := newObj.Object["status"]

			if !oldHas && !newHas {
				return false
			}

			if !newHas {
				return false
			}
			return !reflect.DeepEqual(oldStatus, newStatus)
		},
		DeleteFunc: func(_ event.DeleteEvent) bool {
			return false
		},
		GenericFunc: func(_ event.GenericEvent) bool {
			return false
		},
	})
}

// Handlers for watched resources -- END

// SetupWithManager sets up the controller with the Manager
func (r *FileSystemClaimReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&fusionv1alpha1.FileSystemClaim{}, builder.WithPredicates(predicate.NewPredicateFuncs(isInTargetNamespace))).
		Watches(
			&unstructured.Unstructured{
				Object: map[string]any{
					"apiVersion": LocalDiskGroup + "/" + LocalDiskVersion,
					"kind":       LocalDiskKind,
				},
			},
			enqueueFSCByOwner(),
			didResourceStatusChange(),
		).
		Watches(
			&unstructured.Unstructured{
				Object: map[string]any{
					"apiVersion": FileSystemGroup + "/" + FileSystemVersion,
					"kind":       FileSystemKind,
				},
			},
			enqueueFSCByOwner(),
			didResourceStatusChange(),
		).
		Watches(
			&storagev1.StorageClass{},
			enqueueFSCByStorageClass(),
			didStorageClassChange(),
		).
		Named("filesystemclaim").
		Complete(r)
}
