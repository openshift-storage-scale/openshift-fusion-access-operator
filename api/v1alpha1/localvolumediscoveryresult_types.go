/*
Copyright 2021 The Local Storage Operator Authors.

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

// DiscoveredDevice shows the list of discovered devices with their properties
type DiscoveredDevice struct {
	// DeviceID represents the persistent name of the device. For eg, /dev/disk/by-id/...
	DeviceID string `json:"deviceID"`
	// Path represents the device path. For eg, /dev/sdb
	Path string `json:"path"`
	// Model of the discovered device
	Model string `json:"model"`
	// Type of the discovered device
	Type DiscoveredDeviceType `json:"type"`
	// Vendor of the discovered device
	Vendor string `json:"vendor"`
	// Size of the discovered device
	Size int64 `json:"size"`
	// WWN defines the WWN value of the device.
	WWN string `json:"WWN"`
}

// LocalVolumeDiscoveryResultSpec defines the desired state of LocalVolumeDiscoveryResult
type LocalVolumeDiscoveryResultSpec struct {
	// Node on which the devices are discovered
	NodeName string `json:"nodeName"`
}

// LocalVolumeDiscoveryResultStatus defines the observed state of LocalVolumeDiscoveryResult
type LocalVolumeDiscoveryResultStatus struct {
	// DiscoveredTimeStamp is the last timestamp when the list of discovered devices was updated
	DiscoveredTimeStamp string `json:"discoveredTimeStamp,omitempty"`
	// DiscoveredDevices contains the list of devices which are usable
	// for creating LocalDisks
	// The devices in this list qualify these following conditions.
	// - it should be a non-removable device.
	// - it should not be a read-only device.
	// - it should not be mounted anywhere
	// - it should not be a boot device
	// - it should not have child partitions
	// - it should have a WWN value
	// +optional
	DiscoveredDevices []DiscoveredDevice `json:"discoveredDevices"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
// +kubebuilder:resource:path=localvolumediscoveryresults,scope=Namespaced
// +kubebuilder:resource:shortName=lvdr

// LocalVolumeDiscoveryResult is the Schema for the localvolumediscoveryresults API
type LocalVolumeDiscoveryResult struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   LocalVolumeDiscoveryResultSpec   `json:"spec,omitempty"`
	Status LocalVolumeDiscoveryResultStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// LocalVolumeDiscoveryResultList contains a list of LocalVolumeDiscoveryResult
type LocalVolumeDiscoveryResultList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []LocalVolumeDiscoveryResult `json:"items"`
}

func init() {
	SchemeBuilder.Register(&LocalVolumeDiscoveryResult{}, &LocalVolumeDiscoveryResultList{})
}
