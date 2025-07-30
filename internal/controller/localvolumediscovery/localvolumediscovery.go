package localvolumediscovery

import (
	"context"
	"fmt"

	fusionv1alpha "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"sigs.k8s.io/controller-runtime/pkg/client"
)

func NewLocalVolumeDiscovery(namespace string) *fusionv1alpha.LocalVolumeDiscovery {
	return &fusionv1alpha.LocalVolumeDiscovery{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "auto-discover-devices",
			Namespace: namespace,
		},
	}
}
func CreateOrUpdateLocalVolumeDiscovery(ctx context.Context, devicefinder *fusionv1alpha.LocalVolumeDiscovery, cl client.Client) error {
	oldCP := &fusionv1alpha.LocalVolumeDiscovery{}
	if err := cl.Get(ctx, client.ObjectKeyFromObject(devicefinder), oldCP); apierrors.IsNotFound(err) {
		if err := cl.Create(ctx, devicefinder); err != nil {
			return fmt.Errorf("could not create device finder: %w", err)
		}
	} else if err != nil {
		return fmt.Errorf("could not check for existing device finder: %w", err)
	} else {
		oldCP.OwnerReferences = devicefinder.OwnerReferences
		oldCP.Spec = devicefinder.Spec
		if err := cl.Update(ctx, oldCP); err != nil {
			return fmt.Errorf("could not update device finder: %w", err)
		}
	}
	return nil
}
