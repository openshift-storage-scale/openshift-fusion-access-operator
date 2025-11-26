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

package v1alpha1

import (
	"context"
	"fmt"
	"reflect"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/utils"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

// log is for logging in this package.
var logger = logf.Log.WithName("filesystemclaim-resource")

// +kubebuilder:object:generate=false
// +k8s:deepcopy-gen=false
// +k8s:openapi-gen=false
// FileSystemClaimValidator is responsible for validating FileSystemClaim resources
// when created or updated.
//
// NOTE: The +kubebuilder:object:generate=false and +k8s:deepcopy-gen=false marker prevents controller-gen from generating DeepCopy methods,
// as it is used only for temporary operations and does not need to be deeply copied.
type FileSystemClaimValidator struct {
}

// SetupWebhookWithManager sets up the webhook with the Manager.
func (r *FileSystemClaim) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(r).
		WithValidator(&FileSystemClaimValidator{}).
		Complete()
}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (v *FileSystemClaimValidator) ValidateCreate(_ context.Context, obj runtime.Object) (admission.Warnings, error) {
	fsc, err := convertToFileSystemClaim(obj)
	if err != nil {
		logger.Error(err, "validate create: failed to convert object")
		return nil, err
	}

	logger.Info("validate create", "name", fsc.Name, "namespace", fsc.Namespace, "devices", fsc.Spec.Devices)

	// Validate device ID format, no duplicates, and non-empty (defense-in-depth)
	if err := utils.ValidateDeviceIDs(fsc.Spec.Devices); err != nil {
		return nil, err
	}

	return nil, nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (v *FileSystemClaimValidator) ValidateUpdate(_ context.Context, oldObj, newObj runtime.Object) (admission.Warnings, error) {
	oldFSC, err := convertToFileSystemClaim(oldObj)
	if err != nil {
		logger.Error(err, "validate update: failed to convert old object")
		return nil, err
	}

	newFSC, err := convertToFileSystemClaim(newObj)
	if err != nil {
		logger.Error(err, "validate update: failed to convert new object")
		return nil, err
	}

	logger.Info("validate update",
		"name", newFSC.Name,
		"namespace", newFSC.Namespace,
		"oldDevices", oldFSC.Spec.Devices,
		"newDevices", newFSC.Spec.Devices)

	// If the object is being deleted, allow the update (finalizer removal)
	// but still prevent changes to spec.devices if they are not identical.
	if !newFSC.DeletionTimestamp.IsZero() {
		if reflect.DeepEqual(oldFSC.Spec.Devices, newFSC.Spec.Devices) {
			logger.Info("object is being deleted and spec.devices unchanged, allowing update for finalizer removal", "name", newFSC.Name)
			return nil, nil
		}
		// If spec.devices changed during deletion, it's still an invalid update.
		return nil, fmt.Errorf("spec.devices cannot be modified during deletion")
	}

	// Validate device ID format, no duplicates, and non-empty (defense-in-depth)
	if err := utils.ValidateDeviceIDs(newFSC.Spec.Devices); err != nil {
		return nil, err
	}

	// Check if spec.devices changed
	if reflect.DeepEqual(oldFSC.Spec.Devices, newFSC.Spec.Devices) {
		// No change to devices, allow the update
		logger.Info("devices unchanged, allowing update", "name", newFSC.Name)
		return nil, nil
	}

	// Devices changed - check if LocalDisks are already created by inspecting the current state
	// Check if LocalDiskCreated condition is True
	localDiskCreatedCond := meta.FindStatusCondition(oldFSC.Status.Conditions, ConditionTypeLocalDiskCreated)
	if localDiskCreatedCond == nil {
		// No LocalDiskCreated condition yet, allow the update
		logger.Info("no LocalDiskCreated condition, allowing update", "name", newFSC.Name)
		return nil, nil
	}

	if localDiskCreatedCond.Status != metav1.ConditionTrue {
		// LocalDiskCreated is not True, allow the update
		logger.Info("LocalDiskCreated is not True, allowing update",
			"name", newFSC.Name,
			"status", localDiskCreatedCond.Status,
			"reason", localDiskCreatedCond.Reason)
		return nil, nil
	}

	// LocalDiskCreated is True - block the update
	timestamp := localDiskCreatedCond.LastTransitionTime.Format("2006-01-02 15:04:05 MST")
	errMsg := fmt.Sprintf(
		"spec.devices cannot be modified after LocalDisks are successfully created. "+
			"Current devices: %v. "+
			"LocalDisks were created at %s. "+
			"To use different devices, delete this FileSystemClaim and create a new one.",
		oldFSC.Spec.Devices,
		timestamp,
	)

	logger.Info("blocking device update", "name", newFSC.Name, "reason", "LocalDiskCreated=True")
	return nil, fmt.Errorf("%s", errMsg)
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (v *FileSystemClaimValidator) ValidateDelete(_ context.Context, obj runtime.Object) (admission.Warnings, error) {
	fsc, err := convertToFileSystemClaim(obj)
	if err != nil {
		logger.Error(err, "validate delete: failed to convert object")
		return nil, err
	}

	logger.Info("validate delete", "name", fsc.Name, "namespace", fsc.Namespace)

	// Allow all deletes
	return nil, nil
}

func convertToFileSystemClaim(obj runtime.Object) (*FileSystemClaim, error) {
	fsc, ok := obj.(*FileSystemClaim)
	if !ok {
		return nil, fmt.Errorf("expected a FileSystemClaim object but got %T", obj)
	}
	return fsc, nil
}
