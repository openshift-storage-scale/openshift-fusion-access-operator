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

package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"strings"
	"time"

	"github.com/Masterminds/semver/v3"
	configv1 "github.com/openshift/api/config/v1"
	"gopkg.in/yaml.v3"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

const (
	CheckPodMaxImagePullTimeout = 180 * time.Second
	CheckPodPullInterval        = 2 * time.Second
	CheckPodName                = "image-check-fusion-access"
	CheckPodContainerName       = "check"
)

// Taken from https://www.ibm.com/docs/en/scalecontainernative/5.2.2?topic=planning-software-requirements
type FusionAccessData struct {
	CSIVersion                string   `json:"csi_version"`
	Architecture              []string `json:"architecture"`
	RemoteStorageClusterLevel string   `json:"remote_storage_cluster_level"`
	FileSystemVersion         string   `json:"file_system_version"`
	OpenShiftLevels           []string `json:"openshift_levels"`
}

// The dict key is the IBM Fusion Access Container Native version
var storageScaleTable = map[string]FusionAccessData{
	"5.2.2.0": {
		"2.13.0",
		[]string{"x86_64", "ppc64le", "s390x"},
		"5.1.9.0+",
		"36.00",
		[]string{"4.15", "4.16", "4.17"},
	},
	"5.2.2.1": {
		"2.13.1",
		[]string{"x86_64", "ppc64le", "s390x"},
		"5.1.9.0+",
		"36.00",
		[]string{"4.15", "4.16", "4.17", "4.18"},
	},
	"5.2.3.0": {
		"2.13.1",
		[]string{"x86_64", "ppc64le", "s390x"},
		"5.1.9.0+",
		"36.00",
		[]string{"4.16", "4.17", "4.18"},
	},
}

func IsOpenShiftSupported(ibmFusionAccessVersion string, openShiftVersion semver.Version) bool {
	// Strip the leading "v" from the IBM Fusion Access version
	ibmVer := ibmFusionAccessVersion
	if strings.HasPrefix(ibmFusionAccessVersion, "v") {
		ibmVer = ibmFusionAccessVersion[1:] // Remove the first character
	}

	data, exists := storageScaleTable[ibmVer]
	if !exists {
		return false
	}

	for _, version := range data.OpenShiftLevels {
		constraint, err := semver.NewConstraint(fmt.Sprintf("~%s", version))
		if err != nil {
			return false
		}
		if constraint.Check(&openShiftVersion) {
			return true
		}
	}

	return false
}

// status:
//  history:
//   - completionTime: null
//     image: quay.io/openshift-release-dev/ocp-release@sha256:af19e94813478382e36ae1fa2ae7bbbff1f903dded6180f4eb0624afe6fc6cd4
//     startedTime: "2023-07-18T07:48:54Z"
//     state: Partial
//     verified: true
//     version: 4.13.5
//   - completionTime: "2023-07-18T07:08:50Z"
//     image: quay.io/openshift-release-dev/ocp-release@sha256:e3fb8ace9881ae5428ae7f0ac93a51e3daa71fa215b5299cd3209e134cadfc9c
//     startedTime: "2023-07-18T06:48:44Z"
//     state: Completed
//     verified: false
//     version: 4.13.4
//   observedGeneration: 4
//     version: 4.10.32

// This function returns the current version of the cluster. Ideally
// We return the first version with Completed status
// https://pkg.go.dev/github.com/openshift/api/config/v1#ClusterVersionStatus specifies that the ordering is preserved
// We do have a fallback in case the history does either not exist or it simply has never completed an update:
// in such cases we just fallback to the status.desired.version
func GetCurrentClusterVersion(clusterversion *configv1.ClusterVersion) (*semver.Version, error) {
	// First, check the history for completed versions
	for _, v := range clusterversion.Status.History {
		if v.State == "Completed" {
			return parseAndReturnVersion(v.Version)
		}
	}

	// If no completed versions are found, use the desired version
	return parseAndReturnVersion(clusterversion.Status.Desired.Version)
}

func parseAndReturnVersion(versionStr string) (*semver.Version, error) {
	s, err := semver.NewVersion(versionStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse version %s: %w", versionStr, err)
	}
	return s, nil
}

// GetDeploymentNamespace returns the Namespace this operator is deployed on.
func GetDeploymentNamespace() (string, error) {
	var deployNamespaceEnvVar = "DEPLOYMENT_NAMESPACE"

	ns, found := os.LookupEnv(deployNamespaceEnvVar)
	if !found {
		return "", fmt.Errorf("%s must be set", deployNamespaceEnvVar)
	}
	return ns, nil
}

type ConfigMap struct {
	Kind     string            `yaml:"kind"`
	Metadata map[string]any    `yaml:"metadata"`
	Data     map[string]string `yaml:"data"`
}

type ControllerManagerConfig struct {
	Images map[string]string `yaml:"images"`
}

// ParseYAMLAndExtractCoreInit takes multi-doc YAML and returns coreInit value
func ParseYAMLAndExtractTestImage(yamlContent string) (string, error) {
	decoder := yaml.NewDecoder(strings.NewReader(yamlContent))
	for {
		var node yaml.Node
		if err := decoder.Decode(&node); err != nil {
			if err.Error() == "EOF" {
				break
			}
			return "", fmt.Errorf("failed to decode YAML: %w", err)
		}
		var kindNode struct {
			Kind     string `yaml:"kind"`
			Metadata struct {
				Name string `yaml:"name"`
			} `yaml:"metadata"`
		}
		if err := node.Decode(&kindNode); err != nil {
			continue // not a valid K8s resource, skip
		}
		if kindNode.Kind == "ConfigMap" &&
			kindNode.Metadata.Name == "ibm-spectrum-scale-manager-config" {
			var cm ConfigMap
			if err := node.Decode(&cm); err != nil {
				return "", fmt.Errorf("failed to decode ConfigMap: %w", err)
			}

			embeddedYAML, ok := cm.Data["controller_manager_config.yaml"]
			if !ok {
				return "", fmt.Errorf("controller_manager_config.yaml not found in ConfigMap")
			}

			var config ControllerManagerConfig
			if err := yaml.Unmarshal([]byte(embeddedYAML), &config); err != nil {
				return "", fmt.Errorf("failed to parse embedded YAML: %w", err)
			}

			coreInit, ok := config.Images["coreInit"]
			if !ok {
				return "", fmt.Errorf("coreInit not found in images")
			}

			return coreInit, nil
		}
	}

	return "", fmt.Errorf("ConfigMap object in install yaml not found")
}

// GetExternalTestImage returns the image to be used for testing external image pull.
// FIXME(bandini): For now this is hardcoded, we should make sure this is
func GetExternalTestImage(cnsaVersion string) (string, error) {
	manifestFile, err := GetInstallPath(cnsaVersion)
	if err != nil {
		return "", err
	}
	manifest, err := os.ReadFile(manifestFile)
	if err != nil {
		return "", err
	}

	image, err := ParseYAMLAndExtractTestImage(string(manifest))
	if err != nil {
		return "", err
	}
	return image, nil
}

// CreateImageCheckPod creates a pod with the specified image and returns its name.
func CreateImageCheckPod(
	ctx context.Context,
	client kubernetes.Interface,
	namespace, image, imagePullSecretName string,
) (string, error) {
	existingPod, err := client.CoreV1().Pods(namespace).Get(ctx, CheckPodName, metav1.GetOptions{})
	if err == nil {
		return existingPod.Name, nil // Pod already exists
	}

	pod := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      CheckPodName,
			Namespace: namespace,
		},
		Spec: corev1.PodSpec{
			RestartPolicy: corev1.RestartPolicyNever,
			Containers: []corev1.Container{
				{
					Name:    CheckPodContainerName,
					Image:   image,
					Command: []string{"/bin/sh", "-c", "exit", "0"},
				},
			},
		},
	}
	// Only add ImagePullSecrets if a secret name is provided
	if imagePullSecretName != "" {
		pod.Spec.ImagePullSecrets = []corev1.LocalObjectReference{
			{Name: imagePullSecretName},
		}
	}
	createdPod, err := client.CoreV1().Pods(namespace).Create(ctx, pod, metav1.CreateOptions{})
	if err != nil {
		return "", fmt.Errorf("failed to create pod: %w", err)
	}

	return createdPod.Name, nil
}

// PollPodPullStatus checks if a pod successfully pulled its image or hit an error.
func PollPodPullStatus(
	ctx context.Context,
	client kubernetes.Interface,
	namespace, podName string,
) (bool, error) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return false, fmt.Errorf("timeout while checking image pull status")
		case <-ticker.C:
			pod, err := client.CoreV1().Pods(namespace).Get(ctx, podName, metav1.GetOptions{})
			if err != nil {
				return false, fmt.Errorf("failed to get pod: %w", err)
			}

			if len(pod.Status.ContainerStatuses) == 0 {
				continue
			}

			state := pod.Status.ContainerStatuses[0].State
			if state.Waiting != nil {
				switch state.Waiting.Reason {
				case "ErrImagePull", "ImagePullBackOff":
					return false, fmt.Errorf("image pull failed: %s", state.Waiting.Message)
				}
			} else if state.Running != nil || state.Terminated != nil {
				return true, nil
			}
		}
	}
}

var createPodFunc = CreateImageCheckPod
var pollStatusFunc = PollPodPullStatus

// CanPullImage is a wrapper combining both steps.
func CanPullImage(
	ctx context.Context,
	client kubernetes.Interface,
	namespace, image, imagePullSecret string,
) (bool, error) {
	podName, err := createPodFunc(ctx, client, namespace, image, imagePullSecret)
	if err != nil {
		return false, err
	}

	// Ensure cleanup
	defer func() {
		_ = client.CoreV1().
			Pods(namespace).
			Delete(context.Background(), podName, metav1.DeleteOptions{})
	}()

	return pollStatusFunc(ctx, client, namespace, podName)
}

func GetInstallPath(cnsaVersion string) (string, error) {
	// Install path when running tests
	var err error
	install_path := path.Join("../../files/", cnsaVersion, "install.yaml")
	if _, err := os.Stat(install_path); err == nil {
		return install_path, nil
	}
	// Install path when running locally
	install_path = path.Join("files/", cnsaVersion, "install.yaml")
	if _, err := os.Stat(install_path); err == nil {
		return install_path, nil
	}
	// Install path when running in container
	install_path = path.Join("/files/", cnsaVersion, "install.yaml")
	if _, err := os.Stat(install_path); err == nil {
		return install_path, nil
	}

	return "", fmt.Errorf("could not find/open install file with version %s: %w", cnsaVersion, err)
}

func IsExternalManifestURLAllowed(url string) bool {
	const allowedPrefix = "https://raw.githubusercontent.com/openshift-storage-scale"
	url = strings.TrimSpace(url)
	url = strings.ToLower(url)
	return strings.HasPrefix(url, allowedPrefix)
}

func mergeDockerConfigJSON(destRaw, srcRaw []byte) ([]byte, error) {
	var destCfg map[string]any
	var srcCfg map[string]any

	// Gracefully handle empty JSON
	if len(destRaw) > 0 {
		if err := json.Unmarshal(destRaw, &destCfg); err != nil {
			return nil, fmt.Errorf("invalid dest .dockerconfigjson: %w", err)
		}
	} else {
		destCfg = make(map[string]any)
	}

	if len(srcRaw) > 0 {
		if err := json.Unmarshal(srcRaw, &srcCfg); err != nil {
			return nil, fmt.Errorf("invalid src .dockerconfigjson: %w", err)
		}
	} else {
		srcCfg = make(map[string]any)
	}

	// Merge top-level keys
	for k, v := range srcCfg {
		// Special case: merge auths
		if k == "auths" {
			destAuths, _ := destCfg["auths"].(map[string]any)
			srcAuths, _ := v.(map[string]any)
			if destAuths == nil {
				destAuths = make(map[string]any)
			}
			for reg, auth := range srcAuths {
				destAuths[reg] = auth
			}
			destCfg["auths"] = destAuths
		} else {
			// Regular overwrite for other keys
			destCfg[k] = v
		}
	}

	return json.Marshal(destCfg)
}

func MergeSecrets(dest, src *corev1.Secret) (*corev1.Secret, error) {
	if dest == nil || src == nil {
		return nil, fmt.Errorf("cannot merge nil secrets")
	}

	// Optionally enforce type match
	if dest.Type != "" && src.Type != "" && dest.Type != src.Type {
		return nil, fmt.Errorf("cannot merge secrets of different types: %s vs %s", dest.Type, src.Type)
	}

	// If dest.Type is empty, inherit from src
	if dest.Type == "" {
		dest.Type = src.Type
	}

	// Merge Data
	if dest.Data == nil {
		dest.Data = make(map[string][]byte)
	}

	for k, v := range src.Data {
		if k == ".dockerconfigjson" {
			mergedJSON, err := mergeDockerConfigJSON(dest.Data[k], v)
			if err != nil {
				return nil, fmt.Errorf("failed to merge .dockerconfigjson: %w", err)
			}
			dest.Data[k] = mergedJSON
		} else {
			dest.Data[k] = v
		}
	}
	// Optionally merge StringData too
	if dest.StringData == nil {
		dest.StringData = make(map[string]string)
	}
	for k, v := range src.StringData {
		dest.StringData[k] = v
	}

	return dest, nil
}
