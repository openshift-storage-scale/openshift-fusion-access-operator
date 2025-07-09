package imageregistry

import (
	"context"
	"fmt"
	"slices"

	imageregistryv1 "github.com/openshift/api/imageregistry/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/controller/kernelmodule"
)

// CheckImageRegistryStorage validates that the OpenShift image registry is not using emptyDir storage
func CheckImageRegistryStorage(ctx context.Context, c client.Client) error {
	// Get the cluster-scoped image registry configuration
	imageRegistryConfig := &imageregistryv1.Config{}
	if err := c.Get(ctx, types.NamespacedName{Name: "cluster"}, imageRegistryConfig); err != nil {
		if kerrors.IsNotFound(err) {
			log.Log.Info("Image registry config not found, assuming default configuration")
			return nil
		}
		return fmt.Errorf("failed to get image registry configuration: %w", err)
	}

	// Check if emptyDir storage is configured
	if imageRegistryConfig.Spec.Storage.EmptyDir != nil {
		return fmt.Errorf("image registry is configured with emptyDir storage which is not supported for kernel module builds. " +
			"EmptyDir storage is ephemeral and unsuitable for production use. " +
			"Please configure the image registry with persistent storage (PVC, S3, GCS, Azure, etc.). " +
			"For more information, see: https://docs.openshift.com/container-platform/latest/registry/configuring_registry_storage/configuring-registry-storage-aws-user-infrastructure.html")
	}

	// Also check the status to see what storage is actually being used
	if imageRegistryConfig.Status.Storage.EmptyDir != nil {
		return fmt.Errorf("image registry is currently using emptyDir storage which is not supported for kernel module builds. " +
			"EmptyDir storage is ephemeral and unsuitable for production use. " +
			"Please configure the image registry with persistent storage (PVC, S3, GCS, Azure, etc.). " +
			"For more information, see: https://docs.openshift.com/container-platform/latest/registry/configuring_registry_storage/configuring-registry-storage-aws-user-infrastructure.html")
	}

	log.Log.Info("Image registry storage validation passed", "managementState", imageRegistryConfig.Status.Storage.ManagementState)
	return nil
}

// IsUsingInternalImageRegistry checks if the current KMM configuration is using the internal image registry
func IsUsingInternalImageRegistry(ctx context.Context, c client.Client, ns string) (bool, error) {
	kmmConfig, err := kernelmodule.GetKMMImageConfig(ctx, c, ns)
	if err != nil {
		return false, fmt.Errorf("failed to get KMM image config: %w", err)
	}

	// Check if the registry URL points to the internal image registry
	internalRegistryURLs := []string{
		"image-registry.openshift-image-registry.svc:5000",
		"image-registry.openshift-image-registry.svc.cluster.local:5000",
		"docker-registry.default.svc:5000",
		"docker-registry.default.svc.cluster.local:5000",
	}

	return slices.Contains(internalRegistryURLs, kmmConfig.RegistryURL), nil
}
