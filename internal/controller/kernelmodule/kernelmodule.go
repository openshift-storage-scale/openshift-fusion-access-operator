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

package kernelmodule

import (
	"context"
	"fmt"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/utils"
	"github.com/pkg/errors"

	kmmv1beta1 "github.com/rh-ecosystem-edge/kernel-module-management/api/v1beta1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

const (
	// ServiceAccountName is the name of the service account that will be used for the DS to load the kernel module
	// this will be the same as the operator service account for now
	ServiceAccountName  = "storage-scale-operator-controller-manager"
	ConfigMapName       = "kmm-dockerfile"
	KMMModuleName       = "gpfs-module"
	ImageRepoSecretName = "ibm-entitlement-key"
)

// CreateOrUpdatePlugin creates or updates the resources needed for the remediation console plugin.
// HEADS UP: consider cleanup of old resources in case of name changes or removals!
func CreateOrUpdateKMMResources(ctx context.Context, cl client.Client) error {
	if err := createOrUpdateConfigmap(ctx, cl); err != nil {
		return err
	}
	if err := createOrUpdateKMMModule(ctx, cl); err != nil {
		return err
	}
	// if err := makeImageSecrets(ctx, cl, "openshift-operators"); err != nil {
	// 	return err
	// }
	return nil
}

func createOrUpdateConfigmap(ctx context.Context, cl client.Client) error {
	ns, err := utils.GetDeploymentNamespace()
	if err != nil {
		return err
	}
	cm := newConfigmap(ns)
	oldCM := &corev1.ConfigMap{}
	if err := cl.Get(ctx, client.ObjectKeyFromObject(cm), oldCM); apierrors.IsNotFound(err) {
		if err := cl.Create(ctx, cm); err != nil {
			return errors.Wrap(err, "could not create kmm configmap")
		}
	} else if err != nil {
		return errors.Wrap(err, "could not check for existing kmm configmap")
	} else {
		oldCM.OwnerReferences = cm.OwnerReferences
		oldCM.Data = cm.Data
		if err := cl.Update(ctx, oldCM); err != nil {
			return errors.Wrap(err, "could not update kmm configmap")
		}
	}
	return nil
}

func createOrUpdateKMMModule(ctx context.Context, cl client.Client) error {
	ns, err := utils.GetDeploymentNamespace()
	if err != nil {
		return err
	}
	km := NewKMMModule(ns)
	oldKM := &kmmv1beta1.Module{}
	if err := cl.Get(ctx, client.ObjectKeyFromObject(km), oldKM); apierrors.IsNotFound(err) {
		if err := cl.Create(ctx, km); err != nil {
			return errors.Wrap(err, "could not create kernel module")
		}
	} else if err != nil {
		return errors.Wrap(err, "could not check for existing kernel module")
	} else {
		oldKM.OwnerReferences = km.OwnerReferences
		oldKM.Spec = km.Spec
		if err := cl.Update(ctx, oldKM); err != nil {
			return errors.Wrap(err, "could not update kernel module")
		}
	}
	return nil
}

func NewKMMModule(namespace string) *kmmv1beta1.Module {
	return &kmmv1beta1.Module{
		ObjectMeta: metav1.ObjectMeta{
			Name:      KMMModuleName,
			Namespace: namespace,
		},
		Spec: kmmv1beta1.ModuleSpec{

			ModuleLoader: kmmv1beta1.ModuleLoaderSpec{
				Container: kmmv1beta1.ModuleLoaderContainerSpec{
					Modprobe: kmmv1beta1.ModprobeSpec{
						ModuleName: "mmfslinux",
					},
					KernelMappings: []kmmv1beta1.KernelMapping{
						kmmv1beta1.KernelMapping{
							Regexp:         "^.*\\.x86_64$",
							ContainerImage: fmt.Sprintf("image-registry.openshift-image-registry.svc:5000/%s/gpfs_compat_kmod:${KERNEL_FULL_VERSION}", namespace),
							Build: &kmmv1beta1.Build{
								DockerfileConfigMap: &corev1.LocalObjectReference{
									Name: ConfigMapName,
								},
								KanikoParams: &kmmv1beta1.KanikoParams{},
							},
						},
					},
				},
				ServiceAccountName: ServiceAccountName,
			},
			// ImageRepoSecret: &corev1.LocalObjectReference{
			// 	Name: ImageRepoSecretName,
			// },
			Selector: map[string]string{
				"kubernetes.io/arch": "amd64",
			},
		},
	}
}

func makeImageSecrets(ctx context.Context, cl client.Client, namespace string) error {
	ibm_secret := types.NamespacedName{
		Namespace: namespace,
		Name:      ImageRepoSecretName,
	}
	oldIBMSecret := &corev1.Secret{}
	if err := cl.Get(ctx, ibm_secret, oldIBMSecret); apierrors.IsNotFound(err) {
		return errors.Wrap(err, "secret not found, but it should exist at this point")
	} else if err != nil {
		return errors.Wrap(err, "could not check for existing kernel module")
	} else {
		log.Log.Info(string(oldIBMSecret.Data[".dockerconfigjson"]))
	}
	dockerconfig := types.NamespacedName{
		Namespace: namespace,
		Name:      "builder-dockerconfig-*",
	}
	dockerConfigSecret := &corev1.Secret{}

	// list := &corev1.Secret{}
	// cl.List(ctx, list, &client.ListOptions{Namespace: namespace})

	if err := cl.Get(ctx, dockerconfig, dockerConfigSecret); apierrors.IsNotFound(err) {
		return errors.Wrap(err, "secret not found, but it should exist at this point")
	} else if err != nil {
		return errors.Wrap(err, "could not check for existing kernel module")
	} else {
		log.Log.Info(string(dockerConfigSecret.Data[".dockercfg"]))
	}
	return nil
}

func newConfigmap(namespace string) *corev1.ConfigMap {
	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      ConfigMapName,
			Namespace: namespace,
		},
		Data: map[string]string{
			"dockerfile": `
				ARG IBM_SCALE=quay.io/rhsysdeseng/cp/spectrum/scale/ibm-spectrum-scale-core-init@sha256:fde69d67fddd2e4e0b7d7d85387a221359daf332d135c9b9f239fb31b9b82fe0
				ARG DTK_AUTO=quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:01e0e07cc6c41638f8e9022fb9aa36a7984efcde2166d8158fb59a6c9f7dbbdf
				ARG KERNEL_FULL_VERSION
				FROM ${IBM_SCALE} as src_image
				FROM ${DTK_AUTO} as builder
				COPY --from=src_image /usr/lpp/mmfs /usr/lpp/mmfs
				RUN /usr/lpp/mmfs/bin/mmbuildgpl
				FROM registry.redhat.io/ubi9/ubi-minimal
				ARG KERNEL_FULL_VERSION
				RUN mkdir -p /opt/lib/modules/${KERNEL_FULL_VERSION}
				COPY --from=builder /lib/modules/${KERNEL_FULL_VERSION}/extra/*.ko /opt/lib/modules/${KERNEL_FULL_VERSION}/
				RUN microdnf install kmod -y && microdnf clean all
				RUN depmod -b /opt`,
		},
	}
}
