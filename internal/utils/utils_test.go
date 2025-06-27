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
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/Masterminds/semver/v3"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	configv1 "github.com/openshift/api/config/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
)

func TestDevicefinder(t *testing.T) {
	RegisterFailHandler(Fail)

	RunSpecs(t, "Utilities Suite")
}

var _ = Describe("GetCurrentClusterVersion", func() {
	var (
		clusterVersion *configv1.ClusterVersion
	)

	Context("when there are completed versions in the history", func() {
		BeforeEach(func() {
			clusterVersion = &configv1.ClusterVersion{
				Status: configv1.ClusterVersionStatus{
					History: []configv1.UpdateHistory{
						{State: "Completed", Version: "4.6.1"},
					},
					Desired: configv1.Release{
						Version: "4.7.0",
					},
				},
			}
		})

		It("should return the completed version", func() {
			version, err := GetCurrentClusterVersion(clusterVersion)
			Expect(err).ToNot(HaveOccurred())
			Expect(version.String()).To(Equal("4.6.1"))
		})
	})

	Context("when there are no completed versions in the history", func() {
		BeforeEach(func() {
			clusterVersion = &configv1.ClusterVersion{
				Status: configv1.ClusterVersionStatus{
					History: []configv1.UpdateHistory{
						{State: "Partial", Version: "4.6.1"},
					},
					Desired: configv1.Release{
						Version: "4.7.0",
					},
				},
			}
		})

		It("should return the desired version", func() {
			version, err := GetCurrentClusterVersion(clusterVersion)
			Expect(err).ToNot(HaveOccurred())
			Expect(version.String()).To(Equal("4.7.0"))
		})
	})
})

var _ = Describe("ParseAndReturnVersion", func() {
	Context("when the version string is valid", func() {
		It("should return the parsed version", func() {
			versionStr := "4.6.1"
			version, err := parseAndReturnVersion(versionStr)
			Expect(err).ToNot(HaveOccurred())
			Expect(version.String()).To(Equal(versionStr))
		})
	})

	Context("when the version string is invalid", func() {
		It("should return an error", func() {
			versionStr := "invalid-version"
			version, err := parseAndReturnVersion(versionStr)
			Expect(err).To(HaveOccurred())
			Expect(version).To(BeNil())
		})
	})
})

var _ = Describe("IsOpenShiftSupported", func() {
	DescribeTable("IBM version + OCP version matrix",
		func(ibmVersion string, ocpVersion string, expected bool) {
			version, err := semver.NewVersion(ocpVersion)
			Expect(err).ToNot(HaveOccurred())
			result := IsOpenShiftSupported(ibmVersion, *version)
			Expect(result).To(Equal(expected))
		},

		Entry("5.2.2.0 supports 4.17.3", "5.2.2.0", "4.17.3", true),
		Entry("5.2.2.0 does not support 4.18.1", "5.2.2.0", "4.18.1", false),
		Entry("5.2.2.0 supports 4.15.17", "5.2.2.0", "4.15.17", true),
		Entry("5.2.2.1 supports 4.18.1", "5.2.2.1", "4.18.1", true),
		Entry("5.2.3.0 does not support 4.15.10", "5.2.3.0", "4.15.10", false),
	)

	It("should return false for invalid IBM version", func() {
		version, err := semver.NewVersion("4.9")
		Expect(err).ToNot(HaveOccurred())
		result := IsOpenShiftSupported("invalid_version", *version)
		Expect(result).To(BeFalse())
	})
})

var _ = Describe("Image Pull Checker", func() {
	var (
		client      *fake.Clientset
		namespace   string
		image       string
		testTimeout time.Duration
	)

	BeforeEach(func() {
		client = fake.NewSimpleClientset()
		namespace = "default"
		image = "test.registry.io/valid/image:latest"
		testTimeout = 3 * time.Second
	})

	Describe("PollPodPullStatus", func() {
		It("should detect ErrImagePull and return error", func() {
			pod := &corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "image-fail-pod",
					Namespace: namespace,
				},
				Status: corev1.PodStatus{
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Waiting: &corev1.ContainerStateWaiting{
									Reason:  "ErrImagePull",
									Message: "image not found",
								},
							},
						},
					},
				},
			}

			_, err := client.CoreV1().
				Pods(namespace).
				Create(context.TODO(), pod, metav1.CreateOptions{})
			Expect(err).NotTo(HaveOccurred())

			ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
			defer cancel()

			success, err := PollPodPullStatus(ctx, client, namespace, pod.Name)
			Expect(success).To(BeFalse())
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("image pull failed"))
		})

		It("should detect success if pod is Running", func() {
			pod := &corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "image-success-pod",
					Namespace: namespace,
				},
				Status: corev1.PodStatus{
					ContainerStatuses: []corev1.ContainerStatus{
						{
							State: corev1.ContainerState{
								Running: &corev1.ContainerStateRunning{
									StartedAt: metav1.Now(),
								},
							},
						},
					},
				},
			}

			_, err := client.CoreV1().
				Pods(namespace).
				Create(context.TODO(), pod, metav1.CreateOptions{})
			Expect(err).NotTo(HaveOccurred())

			ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
			defer cancel()

			success, err := PollPodPullStatus(ctx, client, namespace, pod.Name)
			Expect(success).To(BeTrue())
			Expect(err).NotTo(HaveOccurred())
		})

		It("should timeout if pod never updates", func() {
			pod := &corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "image-hang-pod",
					Namespace: namespace,
				},
				Status: corev1.PodStatus{}, // no ContainerStatuses
			}

			_, err := client.CoreV1().
				Pods(namespace).
				Create(context.TODO(), pod, metav1.CreateOptions{})
			Expect(err).NotTo(HaveOccurred())

			ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
			defer cancel()

			success, err := PollPodPullStatus(ctx, client, namespace, pod.Name)
			Expect(success).To(BeFalse())
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("timeout"))
		})
	})

	Describe("CreateImageCheckPod", func() {
		It("should create a pod successfully", func() {
			ctx := context.Background()
			podName, err := CreateImageCheckPod(ctx, client, namespace, image, "")
			Expect(err).NotTo(HaveOccurred())
			Expect(podName).To(Equal(CheckPodName))

			pod, err := client.CoreV1().Pods(namespace).Get(ctx, podName, metav1.GetOptions{})
			Expect(err).NotTo(HaveOccurred())
			Expect(pod.Spec.Containers[0].Image).To(Equal(image))
		})
	})
})

var _ = Describe("CanPullImage", func() {
	const MaxPullTimeout = 5 * time.Second
	var (
		client         *fake.Clientset
		namespace      string
		image          string
		originalCreate func(context.Context, kubernetes.Interface, string, string, string) (string, error)
		originalPoll   func(context.Context, kubernetes.Interface, string, string) (bool, error)
	)

	BeforeEach(func() {
		client = fake.NewSimpleClientset()
		namespace = "default"
		image = "quay.io/example/image:latest"
		originalCreate = CreateImageCheckPod
		originalPoll = PollPodPullStatus
	})

	AfterEach(func() {
		defer func() {
			createPodFunc = originalCreate
			pollStatusFunc = originalPoll
		}()
	})

	It("returns true when pod is created and image is pullable", func() {
		createPodFunc = func(ctx context.Context, clientset kubernetes.Interface, ns, img, pullSecret string) (string, error) {
			// Simulate pod creation
			pod := &corev1.Pod{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "image-check-pod",
					Namespace: ns,
				},
			}
			_, err := clientset.CoreV1().Pods(ns).Create(ctx, pod, metav1.CreateOptions{})
			Expect(err).NotTo(HaveOccurred())
			return pod.Name, nil
		}

		pollStatusFunc = func(ctx context.Context, clientset kubernetes.Interface, ns, podName string) (bool, error) {
			return true, nil
		}
		ctx, cancel := context.WithTimeout(context.Background(), MaxPullTimeout)
		defer cancel()

		ok, err := CanPullImage(ctx, client, namespace, image, "")
		Expect(err).ToNot(HaveOccurred())
		Expect(ok).To(BeTrue())

		_, err = client.CoreV1().Pods(namespace).Get(ctx, "image-check-pod", metav1.GetOptions{})
		Expect(err).To(HaveOccurred()) // Pod should have been deleted
	})

	It("returns error if image cannot be pulled", func() {
		createPodFunc = func(ctx context.Context, clientset kubernetes.Interface, ns, img, pullSecret string) (string, error) {
			return "fail-pod", nil
		}
		pollStatusFunc = func(ctx context.Context, clientset kubernetes.Interface, ns, podName string) (bool, error) {
			return false, errors.New("image pull failed")
		}
		ctx, cancel := context.WithTimeout(context.Background(), MaxPullTimeout)
		defer cancel()

		ok, err := CanPullImage(ctx, client, namespace, image, "")
		Expect(err).To(HaveOccurred())
		Expect(ok).To(BeFalse())
	})

	It("returns error if pod creation fails", func() {
		createPodFunc = func(ctx context.Context, clientset kubernetes.Interface, ns, img, pullSecret string) (string, error) {
			return "", errors.New("create failed")
		}
		ctx, cancel := context.WithTimeout(context.Background(), MaxPullTimeout)
		defer cancel()

		ok, err := CanPullImage(ctx, client, namespace, image, "")
		Expect(err).To(HaveOccurred())
		Expect(ok).To(BeFalse())
	})
})

var _ = Describe("ParseYAMLAndExtractTestImage", func() {
	Context("when YAML contains the correct ConfigMap with coreInit", func() {
		It("should return the coreInit image", func() {
			yaml := `
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ibm-spectrum-scale-manager-config
data:
  controller_manager_config.yaml: |
    images:
      coreInit: quay.io/example/core-init@sha256:abc123
`
			result, err := ParseYAMLAndExtractTestImage(yaml)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(Equal("quay.io/example/core-init@sha256:abc123"))
		})
	})

	Context("when the ConfigMap exists but coreInit is missing", func() {
		It("should return an error", func() {
			yaml := `
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ibm-spectrum-scale-manager-config
data:
  controller_manager_config.yaml: |
    images:
      someOtherImage: quay.io/example/other
`
			_, err := ParseYAMLAndExtractTestImage(yaml)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("coreInit not found"))
		})
	})

	Context("when the ConfigMap exists but controller_manager_config.yaml is missing", func() {
		It("should return an error", func() {
			yaml := `
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ibm-spectrum-scale-manager-config
data:
  other.yaml: |
    images:
      coreInit: quay.io/example/core-init@sha256:abc123
`
			_, err := ParseYAMLAndExtractTestImage(yaml)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("controller_manager_config.yaml not found"))
		})
	})

	Context("when the embedded YAML is malformed", func() {
		It("should return an error", func() {
			yaml := `
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ibm-spectrum-scale-manager-config
data:
  controller_manager_config.yaml: |
    images
      coreInit: quay.io/example/core-init@sha256:abc123
`
			_, err := ParseYAMLAndExtractTestImage(yaml)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("failed to parse embedded YAML"))
		})
	})

	Context("when the ConfigMap is not present", func() {
		It("should return an error", func() {
			yaml := `
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: unrelated-config
data:
  controller_manager_config.yaml: |
    images:
      coreInit: quay.io/example/core-init@sha256:abc123
`
			_, err := ParseYAMLAndExtractTestImage(yaml)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("ConfigMap object in install yaml not found"))
		})
	})

	Context("check all the existing manifests", func() {
		It("should return the coreInit image", func() {
			var matches []string
			absPath, err := filepath.Abs("../../files")
			Expect(err).NotTo(HaveOccurred())

			err = filepath.WalkDir(absPath, func(path string, d fs.DirEntry, err error) error {
				if err != nil {
					return err
				}

				if !d.IsDir() && d.Name() == "install.yaml" {
					matches = append(matches, path)
				}
				return nil
			})

			Expect(err).NotTo(HaveOccurred())
			Expect(matches).ToNot(BeEmpty())

			for _, match := range matches {
				GinkgoWriter.Printf("Checking for image in file: %s -> ", match)
				yaml, err := os.ReadFile(match)
				Expect(err).NotTo(HaveOccurred())
				result, err := ParseYAMLAndExtractTestImage(string(yaml))
				Expect(err).NotTo(HaveOccurred())
				Expect(result).To(Not(BeEmpty()))
				fmt.Printf("%s\n", result)
			}
		})
	})
})

var _ = Describe("IsExternalManifestURLAllowed", func() {
	It("should match exact prefix", func() {
		url := "https://raw.githubusercontent.com/openshift-storage-scale"
		Expect(IsExternalManifestURLAllowed(url)).To(BeTrue())
	})

	It("should match with a path after the prefix", func() {
		url := "https://raw.githubusercontent.com/openshift-storage-scale/project1"
		Expect(IsExternalManifestURLAllowed(url)).To(BeTrue())
	})

	It("should match with leading/trailing whitespace", func() {
		url := "   https://raw.githubusercontent.com/openshift-storage-scale/project1   "
		Expect(IsExternalManifestURLAllowed(url)).To(BeTrue())
	})

	It("should match with uppercase URL", func() {
		url := "HTTPS://RAW.GITHUBUSERCONTENT.COM/OPENSHIFT-STORAGE-SCALE/PROJECT1"
		Expect(IsExternalManifestURLAllowed(url)).To(BeTrue())
	})

	It("should not match similar but incorrect prefix", func() {
		url := "https://raw.githubusercontent.com/openshift/project1"
		Expect(IsExternalManifestURLAllowed(url)).To(BeFalse())
	})

	It("should not match similar but incorrect host", func() {
		url := "https://github.com/openshift-storage-scale/project1"
		Expect(IsExternalManifestURLAllowed(url)).To(BeFalse())
	})

	It("should not match if protocol is different", func() {
		url := "http://raw.githubusercontent.com/openshift-storage-scale"
		Expect(IsExternalManifestURLAllowed(url)).To(BeFalse())
	})

	It("should not match random strings", func() {
		url := "some-random-string"
		Expect(IsExternalManifestURLAllowed(url)).To(BeFalse())
	})
})

var _ = Describe("MergeDockerSecrets", func() {

	Context("when dest is nil", func() {
		It("returns an error", func() {
			_, err := MergeDockerSecrets(nil, &corev1.Secret{})
			Expect(err).To(HaveOccurred())
		})
	})

	Context("when src is nil", func() {
		It("returns an error", func() {
			_, err := MergeDockerSecrets(&corev1.Secret{}, nil)
			Expect(err).To(HaveOccurred())
		})
	})

	Context("when merging .dockerconfigjson", func() {
		It("merges distinct auths from both secrets", func() {
			dest := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{
					".dockerconfigjson": mustMarshal(map[string]any{
						"auths": map[string]any{
							"docker.io": map[string]any{
								"auth": "abc123",
							},
						},
					}),
				},
			}

			src := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{
					".dockerconfigjson": mustMarshal(map[string]any{
						"auths": map[string]any{
							"ghcr.io": map[string]any{
								"auth": "xyz789",
							},
						},
					}),
				},
			}

			merged, err := MergeDockerSecrets(dest, src)
			Expect(err).ToNot(HaveOccurred())

			var mergedJSON map[string]any
			Expect(json.Unmarshal(merged.Data[".dockerconfigjson"], &mergedJSON)).To(Succeed())

			auths := mergedJSON["auths"].(map[string]any)
			Expect(auths).To(HaveKey("docker.io"))
			Expect(auths).To(HaveKey("ghcr.io"))

			Expect(auths["docker.io"].(map[string]any)["auth"]).To(Equal("abc123"))
			Expect(auths["ghcr.io"].(map[string]any)["auth"]).To(Equal("xyz789"))
		})

		It("overwrites duplicate auth entries with src values", func() {
			dest := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{
					".dockerconfigjson": mustMarshal(map[string]any{
						"auths": map[string]any{
							"docker.io": map[string]any{
								"auth": "old-auth",
							},
						},
					}),
				},
			}

			src := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{
					".dockerconfigjson": mustMarshal(map[string]any{
						"auths": map[string]any{
							"docker.io": map[string]any{
								"auth": "new-auth",
							},
						},
					}),
				},
			}

			merged, err := MergeDockerSecrets(dest, src)
			Expect(err).ToNot(HaveOccurred())

			var mergedJSON map[string]any
			Expect(json.Unmarshal(merged.Data[".dockerconfigjson"], &mergedJSON)).To(Succeed())

			auths := mergedJSON["auths"].(map[string]any)
			Expect(auths).To(HaveKey("docker.io"))
			Expect(auths["docker.io"].(map[string]any)["auth"]).To(Equal("new-auth"))
		})

		It("handles missing or empty .dockerconfigjson gracefully", func() {
			dest := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{},
			}

			src := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{
					".dockerconfigjson": mustMarshal(map[string]any{
						"auths": map[string]any{
							"custom.io": map[string]any{
								"auth": "abc",
							},
						},
					}),
				},
			}

			merged, err := MergeDockerSecrets(dest, src)
			Expect(err).ToNot(HaveOccurred())

			var mergedJSON map[string]any
			Expect(json.Unmarshal(merged.Data[".dockerconfigjson"], &mergedJSON)).To(Succeed())

			auths := mergedJSON["auths"].(map[string]any)
			Expect(auths).To(HaveKey("custom.io"))
		})
	})

	Context("when src secret is of dockercfg type", func() {
		It("converts dockercfg to dockerconfigjson and merges distinct entries correctly", func() {
			// Destination secret: Docker config json
			dest := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{
					".dockerconfigjson": mustMarshal(map[string]any{
						"auths": map[string]any{
							"docker.io": map[string]any{
								"auth": "abc123",
							},
						},
					}),
				},
			}

			// Source secret: dockercfg
			src := &corev1.Secret{
				Type: corev1.SecretTypeDockercfg,
				Data: map[string][]byte{
					".dockercfg": []byte(`{
						"ghcr.io": {
							"auth": "xyz789"
						}
					}`),
				},
			}

			// Perform merge
			merged, err := MergeDockerSecrets(dest, src)
			Expect(err).ToNot(HaveOccurred())

			// Unmarshal merged .dockerconfigjson
			var mergedJSON map[string]any
			Expect(json.Unmarshal(merged.Data[".dockerconfigjson"], &mergedJSON)).To(Succeed())

			// Verify merged auths
			auths := mergedJSON["auths"].(map[string]any)
			Expect(auths).To(HaveKey("docker.io"))
			Expect(auths).To(HaveKey("ghcr.io"))

			Expect(auths["docker.io"].(map[string]any)["auth"]).To(Equal("abc123"))
			Expect(auths["ghcr.io"].(map[string]any)["auth"]).To(Equal("xyz789"))
		})

		It("overwrites duplicate auth entries with src values", func() {
			dest := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{
					".dockerconfigjson": mustMarshal(map[string]any{
						"auths": map[string]any{
							"docker.io": map[string]any{
								"auth": "old-auth",
							},
						},
					}),
				},
			}
			src := &corev1.Secret{
				Type: corev1.SecretTypeDockercfg,
				Data: map[string][]byte{
					".dockercfg": []byte(`{
						"docker.io": {
							"auth": "new-auth"
						}
					}`),
				},
			}

			merged, err := MergeDockerSecrets(dest, src)
			Expect(err).ToNot(HaveOccurred())

			var mergedJSON map[string]any
			Expect(json.Unmarshal(merged.Data[".dockerconfigjson"], &mergedJSON)).To(Succeed())

			auths := mergedJSON["auths"].(map[string]any)
			Expect(auths).To(HaveKey("docker.io"))
			Expect(auths["docker.io"].(map[string]any)["auth"]).To(Equal("new-auth"))
		})

		It("handles missing or empty .dockerconfig gracefully", func() {
			dest := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{},
			}

			src := &corev1.Secret{
				Type: corev1.SecretTypeDockercfg,
				Data: map[string][]byte{
					".dockercfg": []byte(`{
						"custom.io": {
							"auth": "abc"
						}
					}`),
				},
			}

			merged, err := MergeDockerSecrets(dest, src)
			Expect(err).ToNot(HaveOccurred())

			var mergedJSON map[string]any
			Expect(json.Unmarshal(merged.Data[".dockerconfigjson"], &mergedJSON)).To(Succeed())

			auths := mergedJSON["auths"].(map[string]any)
			Expect(auths).To(HaveKey("custom.io"))
		})
	})

	Context("when src secret is not of Docker config type", func() {
		It("returns an error", func() {
			// Invalid source type
			src := &corev1.Secret{
				Type: corev1.SecretTypeOpaque,
				Data: map[string][]byte{},
			}
			dest := &corev1.Secret{
				Type: corev1.SecretTypeDockerConfigJson,
				Data: map[string][]byte{},
			}
			_, err := MergeDockerSecrets(dest, src)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("source secret is not of Docker config type"))
		})
	})
})

var _ = Describe("convertDockercfgToDockerconfigjson", func() {
	It("converts a valid .dockercfg to .dockerconfigjson", func() {
		dockercfg := []byte(`{
			"https://index.docker.io/v1/": {
				"auth": "dXNlcjpwYXNz",
				"email": "user@example.com"
			}
		}`)

		converted, err := convertDockercfgToDockerconfigjson(dockercfg)
		Expect(err).ToNot(HaveOccurred())

		var result map[string]any
		err = json.Unmarshal(converted, &result)
		Expect(err).ToNot(HaveOccurred())

		auths, ok := result["auths"].(map[string]any)
		Expect(ok).To(BeTrue())
		Expect(auths).To(HaveKey("https://index.docker.io/v1/"))
	})

	It("passes through valid .dockerconfigjson unchanged", func() {
		dockerconfigjson := []byte(`{
			"auths": {
				"https://index.docker.io/v1/": {
					"auth": "dXNlcjpwYXNz"
				}
			}
		}`)

		converted, err := convertDockercfgToDockerconfigjson(dockerconfigjson)
		Expect(err).ToNot(HaveOccurred())
		Expect(converted).To(MatchJSON(dockerconfigjson)) // Should be unchanged
	})

	It("returns error on invalid JSON", func() {
		invalid := []byte(`{invalid-json}`)

		_, err := convertDockercfgToDockerconfigjson(invalid)
		Expect(err).To(HaveOccurred())
	})

	It("handles empty input gracefully", func() {
		empty := []byte(``)

		_, err := convertDockercfgToDockerconfigjson(empty)
		Expect(err).To(HaveOccurred())
	})

	It("returns empty auths if dockercfg is empty JSON object", func() {
		emptyCfg := []byte(`{}`)

		converted, err := convertDockercfgToDockerconfigjson(emptyCfg)
		Expect(err).ToNot(HaveOccurred())

		var result map[string]any
		err = json.Unmarshal(converted, &result)
		Expect(err).ToNot(HaveOccurred())

		Expect(result).To(HaveKey("auths"))
		Expect(result["auths"]).To(BeEmpty())
	})
})

func mustMarshal(obj any) []byte {
	b, err := json.Marshal(obj)
	Expect(err).ToNot(HaveOccurred())
	return b
}
