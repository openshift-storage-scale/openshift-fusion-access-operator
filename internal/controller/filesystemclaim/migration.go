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
	"fmt"
	"os"
	"regexp"
	"time"

	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	storagev1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

// Constants for migration labels and annotations
const (
	MigrationLabelMigrated       = "fusion.storage.openshift.io/migrated"
	MigrationLabelSource         = "fusion.storage.openshift.io/migration-source"
	MigrationAnnotationTimestamp = "fusion.storage.openshift.io/migration-timestamp"
	MigrationLabelSkip           = "fusion.storage.openshift.io/skip-migration"
	MigrationSourceV1            = "v1.0"
	MigrationNamespace           = "ibm-spectrum-scale"
	SpectrumScaleProvisioner     = "spectrumscale.csi.ibm.com"
	MigrationLabelValueTrue      = "true"
	MigrationDryRunEnvVar        = "MIGRATION_DRY_RUN"
	MigrationReasonComplete      = "MigrationComplete"
	InitialObservedGeneration    = int64(1) // Initial observed generation for status conditions
)

// LegacyResourceGroup represents a group of v1.0 resources that belong together
type LegacyResourceGroup struct {
	FilesystemName string
	LocalDisks     []*unstructured.Unstructured
	Filesystem     *unstructured.Unstructured
	StorageClass   *storagev1.StorageClass
	DevicePaths    []string
	IsValid        bool
}

// MigrationStats tracks migration progress
type MigrationStats struct {
	TotalGroups       int
	SuccessfulGroups  int
	FailedGroups      int
	TotalLocalDisks   int
	SkippedLocalDisks int
}

// RunMigration is the main entry point for v1.0 to v1.1 migration
// It discovers, groups, validates, and migrates legacy resources
func RunMigration(ctx context.Context, c client.Client) error {
	logger := log.FromContext(ctx).WithName("migration")
	logger.Info("Starting v1.0 to v1.1 migration check")

	// Check for dry-run mode
	dryRun := os.Getenv(MigrationDryRunEnvVar) == MigrationLabelValueTrue
	if dryRun {
		logger.Info("Running in DRY-RUN mode - no changes will be made")
	}

	stats := &MigrationStats{}

	// Phase 1: Discovery - find all legacy LocalDisks
	logger.Info("Phase 1: Discovering legacy LocalDisks")
	localDisks, err := discoverLegacyLocalDisks(ctx, c)
	if err != nil {
		return fmt.Errorf("failed to discover legacy LocalDisks: %w", err)
	}
	logger.Info("Discovery complete", "candidateLocalDisks", len(localDisks))
	stats.TotalLocalDisks = len(localDisks)

	if len(localDisks) == 0 {
		logger.Info("No legacy LocalDisks found - migration not needed")
		return nil
	}

	// Phase 2: Grouping - group LocalDisks by Filesystem
	logger.Info("Phase 2: Grouping LocalDisks by Filesystem")
	groups := groupLocalDisksByFilesystem(localDisks)
	logger.Info("Grouping complete", "groups", len(groups))
	stats.TotalGroups = len(groups)

	// Phase 3 & 4: Validate and migrate each group
	for fsName, group := range groups {
		groupLogger := logger.WithValues("filesystem", fsName, "localDisks", len(group.LocalDisks))
		groupLogger.Info("Processing resource group")

		// Phase 3: Validation
		if err := validateResourceGroup(ctx, c, group); err != nil {
			groupLogger.Error(err, "Validation failed, skipping group")
			stats.FailedGroups++
			continue
		}

		if !group.IsValid {
			groupLogger.Info("Group is invalid, skipping")
			stats.FailedGroups++
			continue
		}

		// Phase 4: Migration
		if dryRun {
			groupLogger.Info("DRY-RUN: Would migrate this group", "devices", group.DevicePaths)
			stats.SuccessfulGroups++
			continue
		}

		if err := migrateResourceGroup(ctx, c, group); err != nil {
			groupLogger.Error(err, "Migration failed for group")
			stats.FailedGroups++
			continue
		}

		groupLogger.Info("Migration successful", "devices", group.DevicePaths)
		stats.SuccessfulGroups++
	}

	// Log summary
	logger.Info("Migration complete",
		"totalGroups", stats.TotalGroups,
		"successful", stats.SuccessfulGroups,
		"failed", stats.FailedGroups,
		"totalLocalDisks", stats.TotalLocalDisks)

	return nil
}

// discoverLegacyLocalDisks finds all LocalDisks that are candidates for migration
func discoverLegacyLocalDisks(ctx context.Context, c client.Client) ([]*unstructured.Unstructured, error) {
	logger := log.FromContext(ctx)

	// List all LocalDisks in the namespace
	ldList := &unstructured.UnstructuredList{}
	ldList.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   LocalDiskGroup,
		Version: LocalDiskVersion,
		Kind:    LocalDiskList,
	})

	if err := c.List(ctx, ldList, client.InNamespace(MigrationNamespace)); err != nil {
		// Check if error is because CRD doesn't exist (fresh v1.1 install)
		if meta.IsNoMatchError(err) {
			logger.Info("LocalDisk CRD not found - this is a fresh v1.1 install, no migration needed")
			return []*unstructured.Unstructured{}, nil
		}
		return nil, fmt.Errorf("failed to list LocalDisks: %w", err)
	}

	logger.Info("Found LocalDisks", "total", len(ldList.Items))

	// Filter to find v1.0 candidates
	var candidates []*unstructured.Unstructured
	for i := range ldList.Items {
		ld := &ldList.Items[i]

		if isV1LocalDisk(ld) {
			candidates = append(candidates, ld)
		}
	}

	return candidates, nil
}

// isV1LocalDisk checks if a LocalDisk is a v1.0 resource candidate
func isV1LocalDisk(ld *unstructured.Unstructured) bool {
	labels := ld.GetLabels()

	// Skip if already migrated
	if labels != nil && labels[MigrationLabelMigrated] == MigrationLabelValueTrue {
		return false
	}

	// Skip if user wants to skip migration
	if labels != nil && labels[MigrationLabelSkip] == MigrationLabelValueTrue {
		return false
	}

	// Skip if already owned by FSC
	for _, ownerRef := range ld.GetOwnerReferences() {
		if ownerRef.Kind == FileSystemClaimKind {
			return false
		}
	}

	// Skip if owned by something else
	if len(ld.GetOwnerReferences()) > 0 {
		return false
	}

	// Validate it looks like v1.0
	if !matchesWWNPattern(ld.GetName()) {
		return false
	}

	// Must have status.filesystem field
	fsName, _, _ := unstructured.NestedString(ld.Object, "status", "filesystem")
	if fsName == "" {
		return false
	}

	// Must have spec.device field
	device, _, _ := unstructured.NestedString(ld.Object, "spec", "device")
	if device == "" {
		return false
	}

	// Must have spec.node field
	node, _, _ := unstructured.NestedString(ld.Object, "spec", "node")
	return node != ""
}

// matchesWWNPattern checks if a name matches the expected WWN pattern
func matchesWWNPattern(name string) bool {
	// Match patterns: uuid.*, eui.*, 0x*
	patterns := []string{
		`^uuid\.`,
		`^eui\.`,
		`^0x`,
	}

	for _, pattern := range patterns {
		matched, _ := regexp.MatchString(pattern, name)
		if matched {
			return true
		}
	}

	return false
}

// groupLocalDisksByFilesystem groups LocalDisks by their Filesystem name
func groupLocalDisksByFilesystem(localDisks []*unstructured.Unstructured) map[string]*LegacyResourceGroup {
	groups := make(map[string]*LegacyResourceGroup)

	for _, ld := range localDisks {
		fsName, _, _ := unstructured.NestedString(ld.Object, "status", "filesystem")
		if fsName == "" {
			continue
		}

		if groups[fsName] == nil {
			groups[fsName] = &LegacyResourceGroup{
				FilesystemName: fsName,
				LocalDisks:     []*unstructured.Unstructured{},
				DevicePaths:    []string{},
			}
		}

		groups[fsName].LocalDisks = append(groups[fsName].LocalDisks, ld)

		// Extract device path
		devicePath, _, _ := unstructured.NestedString(ld.Object, "spec", "device")
		if devicePath != "" {
			groups[fsName].DevicePaths = append(groups[fsName].DevicePaths, devicePath)
		}
	}

	return groups
}

// validateResourceGroup validates that a resource group is complete and ready for migration
func validateResourceGroup(ctx context.Context, c client.Client, group *LegacyResourceGroup) error {
	logger := log.FromContext(ctx).WithValues("filesystem", group.FilesystemName)

	// Fetch related resources
	if err := fetchRelatedResources(ctx, c, group); err != nil {
		return fmt.Errorf("failed to fetch related resources: %w", err)
	}

	// Verify Filesystem exists
	if group.Filesystem == nil {
		return fmt.Errorf("filesystem not found")
	}

	// Warn if Filesystem is already owned by FSC (partial migration)
	for _, ownerRef := range group.Filesystem.GetOwnerReferences() {
		if ownerRef.Kind == FileSystemClaimKind {
			logger.Info("Filesystem already owned by FSC, might be partially migrated")
		}
	}

	// Verify StorageClass if it exists
	if group.StorageClass != nil {
		if group.StorageClass.Provisioner != SpectrumScaleProvisioner {
			return fmt.Errorf("StorageClass has wrong provisioner: %s", group.StorageClass.Provisioner)
		}
	} else {
		logger.Info("StorageClass not found, will continue without it")
	}

	// Ensure we have device paths
	if len(group.DevicePaths) == 0 {
		return fmt.Errorf("no device paths found in LocalDisks")
	}

	group.IsValid = true
	return nil
}

// fetchRelatedResources fetches the Filesystem and StorageClass for a group
func fetchRelatedResources(ctx context.Context, c client.Client, group *LegacyResourceGroup) error {
	// Fetch Filesystem
	fs := &unstructured.Unstructured{}
	fs.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   FileSystemGroup,
		Version: FileSystemVersion,
		Kind:    FileSystemKind,
	})

	err := c.Get(ctx, types.NamespacedName{
		Name:      group.FilesystemName,
		Namespace: MigrationNamespace,
	}, fs)

	if err != nil {
		if errors.IsNotFound(err) {
			return fmt.Errorf("filesystem %s not found", group.FilesystemName)
		}
		return fmt.Errorf("failed to get filesystem: %w", err)
	}
	group.Filesystem = fs

	// Fetch StorageClass (cluster-scoped, no namespace)
	sc := &storagev1.StorageClass{}
	err = c.Get(ctx, types.NamespacedName{Name: group.FilesystemName}, sc)
	if err != nil {
		if errors.IsNotFound(err) {
			// StorageClass is optional
			return nil
		}
		return fmt.Errorf("failed to get StorageClass: %w", err)
	}
	group.StorageClass = sc

	return nil
}

// migrateResourceGroup performs the actual migration for a resource group
func migrateResourceGroup(ctx context.Context, c client.Client, group *LegacyResourceGroup) error {
	logger := log.FromContext(ctx).WithValues("filesystem", group.FilesystemName)

	// Step 1: Create or get FilesystemClaim
	fsc, err := createOrGetFilesystemClaim(ctx, c, group)
	if err != nil {
		return fmt.Errorf("failed to create/get FilesystemClaim: %w", err)
	}

	logger.Info("FilesystemClaim ready", "name", fsc.Name)

	// Step 2: Update ownerRefs and labels on all resources
	if err := updateOwnerRefsAndLabels(ctx, c, fsc, group); err != nil {
		return fmt.Errorf("failed to update ownerRefs and labels: %w", err)
	}

	// Step 3: Create migration event
	if err := createMigrationEvent(ctx, c, fsc, group); err != nil {
		logger.Error(err, "Failed to create migration event, but migration succeeded")
	}

	return nil
}

// createOrGetFilesystemClaim creates a new FSC or returns existing one
func createOrGetFilesystemClaim(ctx context.Context, c client.Client, group *LegacyResourceGroup) (*fusionv1alpha1.FileSystemClaim, error) {
	logger := log.FromContext(ctx).WithValues("filesystem", group.FilesystemName)

	// Check if FSC already exists
	fsc := &fusionv1alpha1.FileSystemClaim{}
	err := c.Get(ctx, types.NamespacedName{
		Name:      group.FilesystemName,
		Namespace: MigrationNamespace,
	}, fsc)

	if err == nil {
		// FSC exists
		logger.Info("FilesystemClaim already exists")

		// Verify devices match
		if len(fsc.Spec.Devices) != len(group.DevicePaths) {
			logger.Info("Warning: FSC device count doesn't match LocalDisk group",
				"fscDevices", len(fsc.Spec.Devices),
				"groupDevices", len(group.DevicePaths))
		}

		return fsc, nil
	}

	if !errors.IsNotFound(err) {
		return nil, fmt.Errorf("failed to get FilesystemClaim: %w", err)
	}

	// Create new FSC
	// Use RFC3339 timestamp in annotation (human-readable)
	timestamp := time.Now().Format(time.RFC3339)
	fsc = &fusionv1alpha1.FileSystemClaim{
		ObjectMeta: metav1.ObjectMeta{
			Name:      group.FilesystemName,
			Namespace: MigrationNamespace,
			Labels: map[string]string{
				MigrationLabelMigrated: MigrationLabelValueTrue,
				MigrationLabelSource:   MigrationSourceV1,
			},
			Annotations: map[string]string{
				MigrationAnnotationTimestamp: timestamp,
			},
		},
		Spec: fusionv1alpha1.FileSystemClaimSpec{
			Devices: group.DevicePaths,
		},
	}

	if err := c.Create(ctx, fsc); err != nil {
		return nil, fmt.Errorf("failed to create FilesystemClaim: %w", err)
	}

	logger.Info("Created FilesystemClaim", "devices", len(group.DevicePaths))

	// Set status conditions to indicate resources are already provisioned
	// This prevents the controller from trying to create resources that already exist
	fsc.Status.Conditions = []metav1.Condition{
		{
			Type:               "DeviceValidated",
			Status:             metav1.ConditionTrue,
			LastTransitionTime: metav1.Now(),
			Reason:             MigrationReasonComplete,
			Message:            "Devices validated during v1.0 to v1.1 migration",
			ObservedGeneration: InitialObservedGeneration,
		},
		{
			Type:               "LocalDiskCreated",
			Status:             metav1.ConditionTrue,
			LastTransitionTime: metav1.Now(),
			Reason:             MigrationReasonComplete,
			Message:            fmt.Sprintf("LocalDisks already exist from v1.0 (%d disks)", len(group.LocalDisks)),
			ObservedGeneration: InitialObservedGeneration,
		},
		{
			Type:               "FileSystemCreated",
			Status:             metav1.ConditionTrue,
			LastTransitionTime: metav1.Now(),
			Reason:             MigrationReasonComplete,
			Message:            "Filesystem already exists from v1.0",
			ObservedGeneration: InitialObservedGeneration,
		},
	}

	// Add StorageClass condition if it exists
	if group.StorageClass != nil {
		fsc.Status.Conditions = append(fsc.Status.Conditions, metav1.Condition{
			Type:               "StorageClassCreated",
			Status:             metav1.ConditionTrue,
			LastTransitionTime: metav1.Now(),
			Reason:             MigrationReasonComplete,
			Message:            "StorageClass already exists from v1.0",
			ObservedGeneration: InitialObservedGeneration,
		})
		logger.Info("StorageClass found during migration - VolumeSnapshotClass will be created by reconcile loop",
			"storageClass", group.StorageClass.Name)
	}

	// Note: VolumeSnapshotClass was introduced in v1.2 and will be created automatically
	// by the reconcile loop for all FileSystemClaims
	logger.Info("VolumeSnapshotClass will be created automatically by the FileSystemClaim reconciler")

	// Add Ready condition
	fsc.Status.Conditions = append(fsc.Status.Conditions, metav1.Condition{
		Type:               "Ready",
		Status:             metav1.ConditionTrue,
		LastTransitionTime: metav1.Now(),
		Reason:             MigrationReasonComplete,
		Message:            "All resources migrated successfully from v1.0",
		ObservedGeneration: InitialObservedGeneration,
	})

	// Update status
	if err := c.Status().Update(ctx, fsc); err != nil {
		logger.Error(err, "Failed to update FSC status, but FSC created successfully")
		// Don't return error - FSC is created, status update is best-effort
	}

	return fsc, nil
}

// updateOwnerRefsAndLabels updates ownerRefs and labels on all resources in the group
func updateOwnerRefsAndLabels(ctx context.Context, c client.Client, fsc *fusionv1alpha1.FileSystemClaim, group *LegacyResourceGroup) error {
	logger := log.FromContext(ctx).WithValues("filesystem", group.FilesystemName)
	// Use RFC3339 timestamp in annotation (human-readable)
	timestamp := time.Now().Format(time.RFC3339)

	scheme := runtime.NewScheme()
	if err := fusionv1alpha1.AddToScheme(scheme); err != nil {
		return fmt.Errorf("failed to add scheme: %w", err)
	}

	// Update all LocalDisks
	for _, ld := range group.LocalDisks {
		if hasOwnerRefToFSC(ld, fsc.Name) {
			continue // Already updated
		}

		if err := addOwnerRefAndStandardLabels(ld, fsc, scheme); err != nil {
			return fmt.Errorf("failed to add ownerRef to LocalDisk %s: %w", ld.GetName(), err)
		}

		addMigrationLabels(ld, timestamp)

		if err := c.Update(ctx, ld); err != nil {
			return fmt.Errorf("failed to update LocalDisk %s: %w", ld.GetName(), err)
		}

		logger.Info("Updated LocalDisk", "name", ld.GetName())
	}

	// Update Filesystem
	if !hasOwnerRefToFSC(group.Filesystem, fsc.Name) {
		if err := addOwnerRefAndStandardLabels(group.Filesystem, fsc, scheme); err != nil {
			return fmt.Errorf("failed to add ownerRef to Filesystem: %w", err)
		}

		addMigrationLabels(group.Filesystem, timestamp)

		if err := c.Update(ctx, group.Filesystem); err != nil {
			return fmt.Errorf("failed to update Filesystem: %w", err)
		}

		logger.Info("Updated Filesystem")
	}

	// Update StorageClass labels if it exists (no ownerRef - cluster-scoped resource)
	if group.StorageClass != nil {
		labels := group.StorageClass.GetLabels()
		if labels == nil {
			labels = make(map[string]string)
		}

		// Check if already labeled
		if labels[MigrationLabelMigrated] != MigrationLabelValueTrue {
			// Add standard ownership labels (NO ownerRef - StorageClass is cluster-scoped)
			labels[FileSystemClaimOwnedByNameLabel] = fsc.Name
			labels[FileSystemClaimOwnedByNamespaceLabel] = fsc.Namespace
			group.StorageClass.SetLabels(labels)

			// Add migration labels and annotation using helper (consistent with LD/FS)
			addMigrationLabels(group.StorageClass, timestamp)

			if err := c.Update(ctx, group.StorageClass); err != nil {
				return fmt.Errorf("failed to update StorageClass labels and annotations: %w", err)
			}

			logger.Info("Updated StorageClass labels and annotations (no ownerRef - cluster-scoped)")
		}
	}

	return nil
}

// createMigrationEvent creates a Kubernetes Event for the migration
func createMigrationEvent(ctx context.Context, c client.Client, fsc *fusionv1alpha1.FileSystemClaim, group *LegacyResourceGroup) error {
	scCount := 0
	if group.StorageClass != nil {
		scCount = 1
	}

	event := &corev1.Event{
		ObjectMeta: metav1.ObjectMeta{
			Name:      fmt.Sprintf("migration-%s-%d", fsc.Name, time.Now().Unix()),
			Namespace: fsc.Namespace,
		},
		InvolvedObject: corev1.ObjectReference{
			APIVersion: fsc.APIVersion,
			Kind:       fsc.Kind,
			Name:       fsc.Name,
			Namespace:  fsc.Namespace,
			UID:        fsc.UID,
		},
		Reason:         "MigrationComplete",
		Message:        fmt.Sprintf("Successfully migrated %d LocalDisks, 1 Filesystem, %d StorageClass from v1.0", len(group.LocalDisks), scCount),
		Type:           corev1.EventTypeNormal,
		FirstTimestamp: metav1.NewTime(time.Now()),
		LastTimestamp:  metav1.NewTime(time.Now()),
		Count:          1,
		Source: corev1.EventSource{
			Component: "filesystemclaim-migration",
		},
	}

	return c.Create(ctx, event)
}

// hasOwnerRefToFSC checks if an object has an ownerRef pointing to a specific FSC
func hasOwnerRefToFSC(obj client.Object, fscName string) bool {
	for _, ownerRef := range obj.GetOwnerReferences() {
		if ownerRef.Kind == "FileSystemClaim" && ownerRef.Name == fscName {
			return true
		}
	}
	return false
}

// addOwnerRefAndStandardLabels adds ownerRef and standard ownership labels to an object
func addOwnerRefAndStandardLabels(obj client.Object, fsc *fusionv1alpha1.FileSystemClaim, scheme *runtime.Scheme) error {
	if err := controllerutil.SetOwnerReference(fsc, obj, scheme); err != nil {
		return err
	}

	labels := obj.GetLabels()
	if labels == nil {
		labels = make(map[string]string)
	}
	labels[FileSystemClaimOwnedByNameLabel] = fsc.Name
	labels[FileSystemClaimOwnedByNamespaceLabel] = fsc.Namespace
	obj.SetLabels(labels)

	return nil
}

// addMigrationLabels adds migration-specific labels and annotations to an object
func addMigrationLabels(obj client.Object, timestamp string) {
	// Add migration labels
	labels := obj.GetLabels()
	if labels == nil {
		labels = make(map[string]string)
	}
	labels[MigrationLabelMigrated] = MigrationLabelValueTrue
	labels[MigrationLabelSource] = MigrationSourceV1
	obj.SetLabels(labels)

	// Add timestamp as annotation (human-readable RFC3339 format)
	annotations := obj.GetAnnotations()
	if annotations == nil {
		annotations = make(map[string]string)
	}
	annotations[MigrationAnnotationTimestamp] = timestamp
	obj.SetAnnotations(annotations)
}
