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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Condition types for FileSystemClaim status
const (
	ConditionTypeDeviceValidated     = "DeviceValidated"
	ConditionTypeLocalDiskCreated    = "LocalDiskCreated"
	ConditionTypeFileSystemCreated   = "FileSystemCreated"
	ConditionTypeStorageClassCreated = "StorageClassCreated"
	ConditionTypeDeletionBlocked     = "DeletionBlocked"
	ConditionTypeReady               = "Ready"
)

// FileSystemClaimSpec defines the desired state of FileSystemClaim.
type FileSystemClaimSpec struct {
	// Devices is a list of device paths to be used for the file system. For example, ["/dev/sda", "/dev/sdb"]
	Devices []string `json:"devices,omitempty"`
}

// FileSystemClaimStatus defines the observed state of FileSystemClaim.
type FileSystemClaimStatus struct {
	// Overall conditions
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:shortName=fsc
//nolint:lll
// +kubebuilder:webhook:verbs=create;update,path=/validate-fusion-storage-openshift-io-v1alpha1-filesystemclaim,mutating=false,failurePolicy=fail,groups=fusion.storage.openshift.io,resources=filesystemclaims,versions=v1alpha1,name=vfilesystemclaim.kb.io,admissionReviewVersions=v1,sideEffects=None

// FileSystemClaim is the Schema for the filesystemclaims API.
type FileSystemClaim struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   FileSystemClaimSpec   `json:"spec,omitempty"`
	Status FileSystemClaimStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// FileSystemClaimList contains a list of FileSystemClaim.
type FileSystemClaimList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []FileSystemClaim `json:"items"`
}

func init() {
	SchemeBuilder.Register(&FileSystemClaim{}, &FileSystemClaimList{})
}
