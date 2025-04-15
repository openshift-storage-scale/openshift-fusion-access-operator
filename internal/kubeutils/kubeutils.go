/*
Copyright 2022.

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

package kubeutils

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
)

// CreateOrUpdateResource performs a create-or-update reconciliation for any Kubernetes object.
// T must implement client.Object (usually *corev1.ConfigMap, *corev1.Secret, or custom CRs).
//
// Parameters:
// - ctx: context
// - cl: controller-runtime Kubernetes client
// - desired: fully populated desired object (must include metadata.Name and metadata.Namespace)
// - mutateFn: logic to copy fields from desired to existing
//
// Example usage:
//
//	err := kubeutils.CreateOrUpdateResource(ctx, client, configMap, func(existing, desired *corev1.ConfigMap) error {
//	    existing.Data = desired.Data
//	    return nil
//	})
func CreateOrUpdateResource[T client.Object](
	ctx context.Context,
	cl client.Client,
	desired T,
	mutateFn func(existing, desired T) error,
) error {
	existing := desired.DeepCopyObject().(T)

	namespacedName := types.NamespacedName{
		Name:      desired.GetName(),
		Namespace: desired.GetNamespace(),
	}

	if err := cl.Get(ctx, namespacedName, existing); err != nil && client.IgnoreNotFound(err) != nil {
		return fmt.Errorf("failed to get existing resource: %w", err)
	}

	op, err := controllerutil.CreateOrUpdate(ctx, cl, existing, func() error {
		return mutateFn(existing, desired)
	})

	if err != nil {
		return fmt.Errorf("failed to create or update resource %T %s/%s: %w", desired, desired.GetNamespace(), desired.GetName(), err)
	}

	fmt.Printf("%T %s/%s: %s\n", desired, desired.GetNamespace(), desired.GetName(), op)
	return nil
}
