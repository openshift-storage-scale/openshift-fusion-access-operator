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

// NOTE(bandini): If you change anything in the following two lines you need to update
// ./scripts/update-cnsa-versions-metadata.sh
// +kubebuilder:validation:Enum=v5.2.3.1
type StorageScaleVersions string

// FusionAccessSpec defines the desired state of FusionAccess
type FusionAccessSpec struct {
	// NOTE(bandini): If you change anything in the following three lines you need to update
	// ./scripts/update-cnsa-versions-metadata.sh

	// Version of IBMs installation manifests found at https://github.com/IBM/ibm-spectrum-scale-container-native
	// +operator-sdk:csv:customresourcedefinitions:type=spec,displayName="IBM Storage Scale Version",order=2,xDescriptors={"urn:alm:descriptor:com.tectonic.ui:select:v5.2.3.1"}
	StorageScaleVersion StorageScaleVersions `json:"storageScaleVersion,omitempty"`

	// +operator-sdk:csv:customresourcedefinitions:type=spec,order=3,xDescriptors={"urn:alm:descriptor:com.tectonic.ui:hidden"}
	LocalVolumeDiscovery StorageDeviceDiscovery `json:"storageDeviceDiscovery,omitempty"`
	// +operator-sdk:csv:customresourcedefinitions:type=spec,order=4,xDescriptors={"urn:alm:descriptor:com.tectonic.ui:hidden"}
	// +kubebuilder:validation:Format=uri
	ExternalManifestURL string `json:"externalManifestURL,omitempty"`
}
type StorageDeviceDiscovery struct {
	// +kubebuilder:default:=true
	Create bool `json:"create,omitempty"`
}

// FusionAccessStatus defines the observed state of FusionAccess
type FusionAccessStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	// Conditions is a list of conditions and their status.
	Conditions []metav1.Condition `json:"conditions,omitempty"`
	// TotalProvisionedDeviceCount is the count of the total devices over which the PVs has been provisioned
	TotalProvisionedDeviceCount *int32 `json:"totalProvisionedDeviceCount,omitempty"`
	// observedGeneration is the last generation change the operator has dealt with
	// +optional
	ObservedGeneration int64 `json:"observedGeneration,omitempty"`
	// Show the general status of the fusion access object (this can be shown nicely on ocp console UI)
	Status string `json:"status,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status

// FusionAccess is the Schema for the fusionaccesses API
type FusionAccess struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   FusionAccessSpec   `json:"spec,omitempty"`
	Status FusionAccessStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// FusionAccessList contains a list of FusionAccess
type FusionAccessList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []FusionAccess `json:"items"`
}

func init() {
	SchemeBuilder.Register(&FusionAccess{}, &FusionAccessList{})
}

// DeviceMechanicalProperty holds the device's mechanical spec. It can be rotational or nonRotational
type DeviceMechanicalProperty string

// The mechanical properties of the devices
const (
	// Rotational refers to magnetic disks
	Rotational DeviceMechanicalProperty = "Rotational"
	// NonRotational refers to ssds
	NonRotational DeviceMechanicalProperty = "NonRotational"
)

// DeviceType is the types that will be supported by the LSO.
type DeviceType string

const (
	// RawDisk represents a device-type of block disk
	RawDisk DeviceType = "disk"
	// Partition represents a device-type of partition
	Partition DeviceType = "part"
	// Loop type device
	Loop DeviceType = "loop"
	// Multipath device type
	MultiPath DeviceType = "mpath"
)
