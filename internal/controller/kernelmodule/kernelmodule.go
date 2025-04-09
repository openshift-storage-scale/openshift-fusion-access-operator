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
	"encoding/json"
	"fmt"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/utils"
	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"

	kmmv1beta1 "github.com/rh-ecosystem-edge/kernel-module-management/api/v1beta1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	// ServiceAccountName is the name of the service account that will be used for the DS to load the kernel module
	// this will be the same as the operator service account for now
	ServiceAccountName     = "fusion-access-operator-controller-manager"
	ConfigMapName          = "kmm-dockerfile"
	KMMModuleName          = "gpfs-module"
	ImageRepoSecretName    = "ibm-entitlement-key"
	IBMCNSANamespace       = "ibm-spectrum-scale"
	MergedDockerSecretName = "kmm-build-secret"
)

// CreateOrUpdateKMMResources creates or updates the resources needed for the kernel module builds
// HEADS UP: consider cleanup of old resources in case of name changes or removals!
func CreateOrUpdateKMMResources(ctx context.Context, cl client.Client, pullSecret string) error {
	ns, err := utils.GetDeploymentNamespace()
	if err != nil {
		return err
	}
	dockerConfigmap := newDockerConfigmap(ns)

	if err := createOrUpdateConfigmap(ctx, cl, dockerConfigmap); err != nil {
		return err
	}
	ibmScaleImage, err := getIBMCoreImage(ctx, cl)

	kernelModule := NewKMMModule(ns, ibmScaleImage)

	if err := createOrUpdateKMMModule(ctx, cl, kernelModule); err != nil {
		return err
	}

	buildConfigmap := newBuildConfigmap(IBMCNSANamespace)

	if err := createOrUpdateConfigmap(ctx, cl, buildConfigmap); err != nil {
		return err
	}

	if secret, err := patchGlobalPullSecret(ctx, cl, ns, pullSecret); err != nil {
		return err
	} else {
		if err := createOrUpdateSecret(ctx, cl, secret); err != nil {
			return err
		}
	}
	return nil
}

func createOrUpdateConfigmap(ctx context.Context, cl client.Client, configmap *corev1.ConfigMap) error {
	oldCM := &corev1.ConfigMap{}
	if err := cl.Get(ctx, client.ObjectKeyFromObject(configmap), oldCM); apierrors.IsNotFound(err) {
		if err := cl.Create(ctx, configmap); err != nil {
			return errors.Wrap(err, "could not create kmm configmap")
		}
	} else if err != nil {
		return errors.Wrap(err, "could not check for existing kmm configmap")
	} else {
		oldCM.OwnerReferences = configmap.OwnerReferences
		oldCM.Data = configmap.Data
		if err := cl.Update(ctx, oldCM); err != nil {
			return errors.Wrap(err, "could not update kmm configmap")
		}
	}
	return nil
}

func createOrUpdateSecret(ctx context.Context, cl client.Client, secret *corev1.Secret) error {
	oldSecret := &corev1.Secret{}
	if err := cl.Get(ctx, client.ObjectKeyFromObject(secret), oldSecret); apierrors.IsNotFound(err) {
		if err := cl.Create(ctx, secret); err != nil {
			return errors.Wrap(err, "could not create secret")
		}
	} else if err != nil {
		return errors.Wrap(err, "could not check for existing secret")
	} else {
		oldSecret.OwnerReferences = secret.OwnerReferences
		oldSecret.Data = secret.Data
		if err := cl.Update(ctx, oldSecret); err != nil {
			return errors.Wrap(err, "could not update secret")
		}
	}
	return nil
}

func createOrUpdateKMMModule(ctx context.Context, cl client.Client, km *kmmv1beta1.Module) error {
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

func NewKMMModule(namespace, ibmScaleImage string) *kmmv1beta1.Module {
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
						ModulesLoadingOrder: []string{
							"mmfslinux",
							"mmfs26",
							"tracedev",
						},
					},
					KernelMappings: []kmmv1beta1.KernelMapping{
						kmmv1beta1.KernelMapping{
							Regexp:         "^.*\\.x86_64$",
							ContainerImage: fmt.Sprintf("image-registry.openshift-image-registry.svc:5000/%s/gpfs_compat_kmod:${KERNEL_FULL_VERSION}", namespace),
							Build: &kmmv1beta1.Build{
								DockerfileConfigMap: &corev1.LocalObjectReference{
									Name: ConfigMapName,
								},
								BuildArgs: []kmmv1beta1.BuildArg{
									kmmv1beta1.BuildArg{
										Name:  "IBM_SCALE",
										Value: ibmScaleImage,
									},
								},
							},
							// Sign: &kmmv1beta1.Sign{
							// 	FilesToSign: []string{
							// 		"/opt/lib/modules/${KERNEL_FULL_VERSION}/mmfslinux.ko",
							// 	},
							// 	KeySecret:  &corev1.LocalObjectReference{Name: "my-signing-key"},
							// 	CertSecret: &corev1.LocalObjectReference{Name: "my-signing-key-pub"},
							// },
						},
					},
				},
				ServiceAccountName: ServiceAccountName,
			},
			// ImageRepoSecret: &corev1.LocalObjectReference{
			// 	Name: MergedDockerSecretName,
			// },
			Selector: map[string]string{
				"kubernetes.io/arch": "amd64",
			},
		},
	}
}

// patchGlobalPullSecret will patch the global pull secret with the ibm pull secrets
func patchGlobalPullSecret(ctx context.Context, cl client.Client, namespace string, pullsecret string) (*corev1.Secret, error) {
	var secrets map[string]map[string]map[string]string
	if err := json.Unmarshal([]byte(pullsecret), &secrets); err != nil {
		return nil, err
	}

	globalPullSecret := &corev1.Secret{}

	if err := cl.Get(ctx, types.NamespacedName{Namespace: "openshift-config", Name: "pull-secret"}, globalPullSecret); err != nil {
		return nil, err
	}

	var dockerConfigJSON map[string]map[string]map[string]string
	if err := json.Unmarshal([]byte(globalPullSecret.Data[".dockerconfigjson"]), &dockerConfigJSON); err != nil {
		return nil, err
	}

	for k, v := range secrets["auths"] {
		dockerConfigJSON["auths"][k] = v
	}

	rawDockerConfigJSON, err := json.Marshal(dockerConfigJSON)
	if err != nil {
		return nil, err
	}
	secretData := map[string][]byte{
		".dockerconfigjson": rawDockerConfigJSON,
	}
	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "pull-secret",
			Namespace: "openshift-config",
		},
		Data: secretData,
		Type: "kubernetes.io/dockerconfigjson",
	}, nil
}

// getIBMCoreImage gets the core init image with the source code in them
func getIBMCoreImage(ctx context.Context, cl client.Client) (string, error) {
	cm := &corev1.ConfigMap{}
	cl.Get(ctx, types.NamespacedName{Namespace: "ibm-spectrum-scale-operator", Name: "ibm-spectrum-scale-manager-config"}, cm)
	var objmap map[string]interface{}
	if err := yaml.Unmarshal([]byte(cm.Data["controller_manager_config.yaml"]), &objmap); err != nil {
		return "", err
	}
	return objmap["images"].(map[string]interface{})["coreInit"].(string), nil
}

func newDockerConfigmap(namespace string) *corev1.ConfigMap {
	dockerFileValue := `ARG IBM_SCALE=quay.io/rhsysdeseng/cp/spectrum/scale/ibm-spectrum-scale-core-init@sha256:fde69d67fddd2e4e0b7d7d85387a221359daf332d135c9b9f239fb31b9b82fe0
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
RUN depmod -b /opt`

	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      ConfigMapName,
			Namespace: namespace,
		},
		Data: map[string]string{
			"dockerfile": dockerFileValue,
		},
	}
}

func newBuildConfigmap(namespace string) *corev1.ConfigMap {
	buildGplValue := `#!/bin/sh
kerv=$(uname -r)
touch /usr/lpp/mmfs/bin/lxtrace-$kerv
if ! lsmod | grep -q "^mmfslinux"; then echo "Kernel module is not loaded"; exit 1; fi
mkdir -p /lib/modules/$kerv/extra
echo "This is a workaround to pass some file validation on IBM container" > /lib/modules/$kerv/extra/mmfslinux.ko
echo "This is a workaround to pass some file validation on IBM container" > /lib/modules/$kerv/extra/tracedev.ko
exit 0
`
	hostPathValue := `/
`

	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "buildgpl",
			Namespace: namespace,
			Labels: map[string]string{
				"app.kubernetes.io/instance": "ibm-spectrum-scale",
				"app.kubernetes.io/name":     "cluster",
			},
		},
		Data: map[string]string{
			"buildgpl":            buildGplValue,
			"hostPathDirectories": hostPathValue,
		},
	}
}
