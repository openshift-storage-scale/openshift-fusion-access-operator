package common

import (
	"os"
)

const (
	defaultDeviceFinderImageVersion = "quay.io/openshift-storage-scale/openshift-fusion-access-devicefinder"

	// OwnerNamespaceLabel references the owning object's namespace
	OwnerNamespaceLabel = "fusion.storage.openshift.io/owner-namespace"
	// OwnerNameLabel references the owning object
	OwnerNameLabel = "fusion.storage.openshift.io/owner-name"

	// DeviceFinderImageEnv is used by the operator to read the RELATED_IMAGE_OPENSHIFT-STORAGE-SCALE-OPERATOR-DEVICEFINDER from the environment
	DeviceFinderImageEnv = "RELATED_IMAGE_OPENSHIFT-STORAGE-SCALE-OPERATOR-DEVICEFINDER"
	// KubeRBACProxyImageEnv is used by the operator to read the KUBE_RBAC_PROXY_IMAGE from the environment
	KubeRBACProxyImageEnv = "KUBE_RBAC_PROXY_IMAGE"

	// DiscoveryNodeLabelKey is the label key on the discovery result CR used to identify the node it belongs to.
	// the value is the node's name
	DiscoveryNodeLabel = "discovery-result-node"

	DeviceFinderDiscoveryDaemonSetTemplate = "templates/devicefinder-discovery-daemonset.yaml"
)

// GetDeviceFinderImage returns the image to be used for devicefinder daemonset
func GetDeviceFinderImage() string {
	if deviceFinderImageFromEnv := os.Getenv(DeviceFinderImageEnv); deviceFinderImageFromEnv != "" {
		return deviceFinderImageFromEnv
	}
	return defaultDeviceFinderImageVersion
}
