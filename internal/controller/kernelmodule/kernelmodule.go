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
	"regexp"
	"strconv"
	"strings"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/kubeutils"
	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/utils"

	"gopkg.in/yaml.v3"

	kmmv1beta1 "github.com/rh-ecosystem-edge/kernel-module-management/api/v1beta1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

const (
	// ServiceAccountName is the name of the service account that will be used for the DS to load the kernel module
	// this will be the same as the operator service account for now
	ServiceAccountName                  = "fusion-access-operator-controller-manager"
	ConfigMapName                       = "kmm-dockerfile"
	KMMModuleName                       = "gpfs-module"
	IBMENTITLEMENTNAME                  = "ibm-entitlement-key"
	SecureBootKey                       = "secureboot-signing-key"
	SecureBootKeyPub                    = "secureboot-signing-key-pub"
	KMMImageConfigMapName               = "kmm-image-config"
	KMMImageConfigKeyRegistryURL        = "kmm_image_registry_url"
	KMMImageConfigKeyRepo               = "kmm_image_repo"
	KMMImageConfigKeyTLSInsecure        = "kmm_tls_insecure"
	KMMImageConfigKeyTLSSkipVerify      = "kmm_tls_skip_verify"
	KMMImageConfigKeyRegistrySecretName = "kmm_image_registry_secret_name" //nolint:gosec
	KMMRegistryPushPullSecretName       = "kmm-registry-push-pull-secret"  //nolint:gosec
)

// CreateOrUpdateKMMResources creates or updates the resources needed for the kernel module builds
// HEADS UP: consider cleanup of old resources in case of name changes or removals!
func CreateOrUpdateKMMResources(ctx context.Context, cl client.Client) error {
	ns, err := utils.GetDeploymentNamespace()
	if err != nil {
		return fmt.Errorf("failed to get namespace in CreateOrUpdateKMMResources: %w", err)
	}

	KMMImageConfig, err := GetKMMImageConfig(ctx, cl, ns)
	if err != nil {
		return fmt.Errorf("failed to get KMMImageConfigmap in CreateOrUpdateKMMResources: %w", err)
	}

	var secret *corev1.Secret
	if secret, err = getMergedRegistrySecret(ctx, cl, ns, &KMMImageConfig); err != nil {
		return fmt.Errorf("failed to getMergedRegistrySecret in CreateOrUpdateKMMResources: %w", err)
	}
	if err := kubeutils.CreateOrUpdateResource(ctx, cl, secret, func(existing, desired *corev1.Secret) error {
		existing.Type = desired.Type
		existing.Data = desired.Data
		return nil
	}); err != nil {
		return fmt.Errorf("failed to update secret in CreateOrUpdateKMMResources: %w", err)
	}

	dockerConfigmap := NewDockerConfigmap(ns)
	if err := kubeutils.CreateOrUpdateResource(ctx, cl, dockerConfigmap, func(existing, desired *corev1.ConfigMap) error {
		existing.Data = desired.Data
		return nil
	}); err != nil {
		return fmt.Errorf("failed to update dockerconfigmap for KMM: %w", err)
	}

	ibmScaleImage, err := getIBMCoreImage(ctx, cl)
	if err != nil {
		return fmt.Errorf("failed to get coreImage in CreateOrUpdateKMMResources: %w", err)
	}
	signModules := doSigningSecretsExist(ctx, cl, ns)

	kernelModule := NewKMMModule(ns, ibmScaleImage, signModules, &KMMImageConfig)
	if err := kubeutils.CreateOrUpdateResource(ctx, cl, kernelModule, mutateKMMModule); err != nil {
		return fmt.Errorf("failed to update kernelModule in CreateOrUpdateKMMResources: %w", err)
	}

	return nil
}

func doSigningSecretsExist(ctx context.Context, cl client.Client, namespace string) bool {
	secretNames := []string{SecureBootKey, SecureBootKeyPub}
	for _, name := range secretNames {
		err := cl.Get(ctx, types.NamespacedName{Namespace: namespace, Name: name}, &corev1.Secret{})
		if err != nil {
			return false
		}
	}
	return true // Both secrets found
}

func mutateKMMModule(existing, desired *kmmv1beta1.Module) error {
	existing.Spec = desired.Spec
	return nil
}

func NewKMMModule(namespace, ibmScaleImage string, sign bool, kmmImageConfig *KMMImageConfig) *kmmv1beta1.Module {
	var signing *kmmv1beta1.Sign
	var selector map[string]string

	ibmImageHash := getIBMCoreImageHash(ibmScaleImage)

	// We need to truncate the image hash so the module image tag fits into 128 chars, otherwise it is an invalid docker reference
	const maxHashLength = 32
	if len(ibmImageHash) > maxHashLength {
		ibmImageHash = ibmImageHash[:maxHashLength]
	}

	ibmImageHashLabel := getIBMCoreImageHashForLabel(ibmScaleImage)
	if ibmImageHashLabel != "" {
		selector = map[string]string{
			"kubernetes.io/arch":                  "amd64",
			"scale.spectrum.ibm.com/image-digest": ibmImageHashLabel,
		}
	} else {
		selector = map[string]string{
			"kubernetes.io/arch": "amd64",
		}
	}

	// See https://docs.redhat.com/en/documentation/openshift_container_platform/4.18/html/specialized_hardware_and_driver_enablement/
	//     kernel-module-management-operator#kmm-adding-the-keys-for-secureboot_kernel-module-management-operator
	if sign {
		signing = &kmmv1beta1.Sign{
			FilesToSign: []string{
				"/opt/lib/modules/${KERNEL_FULL_VERSION}/mmfslinux.ko",
				"/opt/lib/modules/${KERNEL_FULL_VERSION}/mmfs26.ko",
				"/opt/lib/modules/${KERNEL_FULL_VERSION}/tracedev.ko",
			},
			KeySecret:  &corev1.LocalObjectReference{Name: SecureBootKey},
			CertSecret: &corev1.LocalObjectReference{Name: SecureBootKeyPub},
		}
	} else {
		signing = nil
	}

	return &kmmv1beta1.Module{
		ObjectMeta: metav1.ObjectMeta{
			Name:      KMMModuleName,
			Namespace: namespace,
		},
		Spec: kmmv1beta1.ModuleSpec{
			ModuleLoader: kmmv1beta1.ModuleLoaderSpec{
				Container: kmmv1beta1.ModuleLoaderContainerSpec{
					ImagePullPolicy: corev1.PullAlways,
					Modprobe: kmmv1beta1.ModprobeSpec{
						ModuleName: "mmfs26",
						ModulesLoadingOrder: []string{
							"mmfs26",
							"mmfslinux",
							"tracedev",
						},
						// This is used to copy the lxtrace binary from /opt/lxtrace/${KERNEL_FULL_VERSION}/*
						// to kmm-operator-manager-config` at `worker.setFirmwareClassPath`
						FirmwarePath: "/opt/lxtrace/",
					},
					RegistryTLS: kmmv1beta1.TLSOptions{
						Insecure:              kmmImageConfig.TLSInsecure,
						InsecureSkipTLSVerify: kmmImageConfig.TLSSkipVerify,
					},

					KernelMappings: []kmmv1beta1.KernelMapping{{
						Regexp:         "^.*\\.x86_64$",
						ContainerImage: fmt.Sprintf("%s/%s:${KERNEL_FULL_VERSION}-%s", kmmImageConfig.RegistryURL, kmmImageConfig.Repo, ibmImageHash),
						Build: &kmmv1beta1.Build{
							DockerfileConfigMap: &corev1.LocalObjectReference{
								Name: ConfigMapName,
							},
							BuildArgs: []kmmv1beta1.BuildArg{
								{
									Name:  "IBM_SCALE",
									Value: ibmScaleImage,
								},
							},
						},
						Sign: signing,
					},
					},
				},
				ServiceAccountName: ServiceAccountName,
			},
			ImageRepoSecret: func() *corev1.LocalObjectReference {
				return &corev1.LocalObjectReference{Name: KMMRegistryPushPullSecretName}
			}(),
			Selector: selector,
		},
	}
}

// Struct to hold image config
type KMMImageConfig struct {
	RegistryURL        string
	Repo               string
	TLSInsecure        bool
	TLSSkipVerify      bool
	RegistrySecretName string
}

// Public function to get KMMImageConfig from ConfigMap held in var GetKMMImageConfig
var GetKMMImageConfig = func(ctx context.Context, cl client.Client, namespace string) (KMMImageConfig, error) {
	config := KMMImageConfig{
		RegistryURL:        "image-registry.openshift-image-registry.svc:5000",
		Repo:               fmt.Sprintf("%s/gpfs_compat_kmod", namespace),
		TLSInsecure:        false,
		TLSSkipVerify:      false,
		RegistrySecretName: "",
	}
	cm := &corev1.ConfigMap{}
	if err := cl.Get(ctx, types.NamespacedName{Namespace: namespace, Name: KMMImageConfigMapName}, cm); err != nil {
		if errors.IsNotFound(err) {
			log.Log.Info(fmt.Sprintf("Configmap %s not found, using default values", KMMImageConfigMapName))
			return config, nil
		}
		return config, fmt.Errorf("failed to get configmap %s in GetKMMImageConfig: %w", KMMImageConfigMapName, err)
	}
	data := cm.Data

	// Override values if present
	if val, ok := data[KMMImageConfigKeyRegistryURL]; ok {
		config.RegistryURL = val
	}
	if val, ok := data[KMMImageConfigKeyRepo]; ok {
		config.Repo = val
	}
	if val, ok := data[KMMImageConfigKeyTLSInsecure]; ok {
		if parsed, err := strconv.ParseBool(val); err == nil {
			config.TLSInsecure = parsed
		}
	}
	if val, ok := data[KMMImageConfigKeyTLSSkipVerify]; ok {
		if parsed, err := strconv.ParseBool(val); err == nil {
			config.TLSSkipVerify = parsed
		}
	}
	if val, ok := data[KMMImageConfigKeyRegistrySecretName]; ok {
		config.RegistrySecretName = val
	}

	return config, nil
}

// getMergedRegistrySecret will return the merged secret (registry used for kmm and core images)
func getMergedRegistrySecret(ctx context.Context, cl client.Client, namespace string, kmmImageConfig *KMMImageConfig) (*corev1.Secret, error) {
	ibmPullSecret := &corev1.Secret{}
	if err := cl.Get(ctx, types.NamespacedName{Namespace: namespace, Name: IBMENTITLEMENTNAME}, ibmPullSecret); err != nil {
		return nil, fmt.Errorf("failed to get ibmPullSecret pull secret %s in getMergedRegistrySecret: %w", IBMENTITLEMENTNAME, err)
	}
	registrySecret := &corev1.Secret{}
	if kmmImageConfig.RegistrySecretName != "" {
		if err := cl.Get(ctx, types.NamespacedName{Namespace: namespace, Name: kmmImageConfig.RegistrySecretName}, registrySecret); err != nil {
			return nil, fmt.Errorf("failed to get secret %s in getMergedRegistrySecret: %w", kmmImageConfig.RegistrySecretName, err)
		}
	} else {
		builderSecretName, err := GetServiceAccountDockercfgSecretName(ctx, cl, namespace, "builder")
		if err != nil {
			return nil, fmt.Errorf("error fetching dockercfg secret in getMergedRegistrySecret: %w", err)
		}
		if err := cl.Get(ctx, types.NamespacedName{Namespace: namespace, Name: builderSecretName}, registrySecret); err != nil {
			return nil, fmt.Errorf("failed to get secret (for internal registry) %s in getMergedRegistrySecret: %w", builderSecretName, err)
		}
	}
	KMMRegistryPushPullSecret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      KMMRegistryPushPullSecretName,
			Namespace: namespace,
		},
	}
	KMMRegistryPushPullSecret, err := utils.MergeDockerSecrets(KMMRegistryPushPullSecret, ibmPullSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to merge ibm pull secret: %w", err)
	}

	KMMRegistryPushPullSecret, err = utils.MergeDockerSecrets(KMMRegistryPushPullSecret, registrySecret)
	if err != nil {
		return nil, fmt.Errorf("failed to merge registry secret: %w", err)
	}

	return KMMRegistryPushPullSecret, nil
}

// getIBMCoreImage gets the core init image with the source code in them
func getIBMCoreImage(ctx context.Context, cl client.Client) (string, error) {
	cm := &corev1.ConfigMap{}
	err := cl.Get(ctx, types.NamespacedName{Namespace: "ibm-spectrum-scale-operator", Name: "ibm-spectrum-scale-manager-config"}, cm)
	if err != nil {
		return "", err
	}
	var objmap map[string]any
	if err := yaml.Unmarshal([]byte(cm.Data["controller_manager_config.yaml"]), &objmap); err != nil {
		return "", err
	}
	return objmap["images"].(map[string]any)["coreInit"].(string), nil
}

func getIBMCoreImageHash(image string) string {
	if atIdx := strings.Index(image, "@sha256:"); atIdx != -1 {
		return image[atIdx+len("@sha256:"):]
	}
	if colonIdx := strings.LastIndex(image, ":"); colonIdx != -1 && !strings.Contains(image[colonIdx:], "/") {
		return image[colonIdx+1:]
	}
	return ""
}

// This needs to truncate at 63 due to k8s length limits
func getIBMCoreImageHashForLabel(image string) string {
	const maxLabelLength = 63
	hash := getIBMCoreImageHash(image)
	if len(hash) > maxLabelLength {
		return hash[:maxLabelLength]
	}
	return hash
}

func NewDockerConfigmap(namespace string) *corev1.ConfigMap {
	dockerFileValue := `ARG IBM_SCALE
ARG DTK_AUTO
ARG KERNEL_FULL_VERSION
FROM ${IBM_SCALE} as src_image
FROM ${DTK_AUTO} as builder
ARG KERNEL_FULL_VERSION
COPY --from=src_image /usr/lpp/mmfs /usr/lpp/mmfs
RUN /usr/lpp/mmfs/bin/mmbuildgpl
RUN mkdir -p /opt/lib/modules/${KERNEL_FULL_VERSION}/
RUN cp -avf /lib/modules/${KERNEL_FULL_VERSION}/extra/*.ko /opt/lib/modules/${KERNEL_FULL_VERSION}/
RUN depmod -b /opt
FROM registry.redhat.io/ubi9/ubi-minimal
ARG KERNEL_FULL_VERSION
RUN mkdir -p /opt/lib/modules/${KERNEL_FULL_VERSION}/ /opt/lxtrace/
COPY --from=builder /opt/lib/modules/${KERNEL_FULL_VERSION}/*.ko /opt/lib/modules/${KERNEL_FULL_VERSION}/
COPY --from=builder /opt/lib/modules/${KERNEL_FULL_VERSION}/modules* /opt/lib/modules/${KERNEL_FULL_VERSION}/
COPY --from=builder /usr/lpp/mmfs/bin/lxtrace-${KERNEL_FULL_VERSION} /opt/lxtrace/`

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

// GetServiceAccountDockercfgSecretName fetches the Docker config secret name for a given service account
var GetServiceAccountDockercfgSecretName = func(ctx context.Context, cl client.Client, namespace, serviceAccountName string) (string, error) {
	// Define the secret name pattern based on the service account name
	secretPattern := fmt.Sprintf("^%s-dockercfg-.*$", serviceAccountName)

	// List all secrets in the same namespace as the service account
	secrets := &corev1.SecretList{}
	if err := cl.List(ctx, secrets, &client.ListOptions{Namespace: namespace}); err != nil {
		return "", fmt.Errorf("failed to list secrets in namespace %s: %w", namespace, err)
	}

	// Iterate through secrets to find the one matching the pattern
	for i := range secrets.Items {
		secret := &secrets.Items[i] // Use pointer to secret
		// Match the secret name with the pattern
		matched, _ := regexp.MatchString(secretPattern, secret.Name)
		if matched {
			return secret.Name, nil
		}
	}

	// Return an error if no secret matches the pattern
	return "", fmt.Errorf("no dockercfg secret found for service account %s in namespace %s", serviceAccountName, namespace)
}
