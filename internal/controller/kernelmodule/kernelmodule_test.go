package kernelmodule

import (
	"strings"
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	kmmv1beta1 "github.com/rh-ecosystem-edge/kernel-module-management/api/v1beta1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var _ = Describe("ExtractImageVersion", func() {
	It("should extract digest from image with sha256", func() {
		image := "cp.icr.io/cp/gpfs/ibm-spectrum-scale-core-init@sha256:8bd2d8d1663d5a709327561d92e962ed1e6fb4925df9925701a637cadc22be2b"
		expected := "8bd2d8d1663d5a709327561d92e962ed1e6fb4925df9925701a637cadc22be2b"
		Expect(getIBMCoreImageHash(image)).To(Equal(expected))
	})

	It("should extract tag from image with version tag", func() {
		image := "quay.io/openshift-storage-scale/ibm-spectrum-scale-core-init:5.2.3.1.dev3"
		expected := "5.2.3.1.dev3"
		Expect(getIBMCoreImageHash(image)).To(Equal(expected))
	})

	It("should return empty string for image with no tag or digest", func() {
		image := "docker.io/library/ubuntu"
		Expect(getIBMCoreImageHash(image)).To(Equal(""))
	})

	It("should not be confused by colons in registry paths", func() {
		image := "myregistry:5000/myrepo/myimage:1.0.0"
		expected := "1.0.0"
		Expect(getIBMCoreImageHash(image)).To(Equal(expected))
	})

	It("should return empty string for empty input", func() {
		image := ""
		Expect(getIBMCoreImageHash(image)).To(Equal(""))
	})
})

var _ = Describe("getIBMCoreImageHashForLabel", func() {
	It("returns digest when image has sha256 hash (and truncates it to 63)", func() {
		image := "cp.icr.io/cp/gpfs/ibm-spectrum-scale-core-init@sha256:8bd2d8d1663d5a709327561d92e962ed1e6fb4925df9925701a637cadc22be2b"
		expected := "8bd2d8d1663d5a709327561d92e962ed1e6fb4925df9925701a637cadc22be2"
		Expect(getIBMCoreImageHashForLabel(image)).To(Equal(expected))
	})

	It("returns tag when image has version tag", func() {
		image := "quay.io/openshift-storage-scale/ibm-spectrum-scale-core-init:5.2.3.1.dev3"
		expected := "5.2.3.1.dev3"
		Expect(getIBMCoreImageHashForLabel(image)).To(Equal(expected))
	})

	It("returns empty string when image has no tag or digest", func() {
		image := "docker.io/library/ubuntu"
		Expect(getIBMCoreImageHashForLabel(image)).To(Equal(""))
	})

	It("handles registry URLs with ports", func() {
		image := "registry.local:5000/image/name:custom-tag"
		expected := "custom-tag"
		Expect(getIBMCoreImageHashForLabel(image)).To(Equal(expected))
	})

	It("returns empty string for empty input", func() {
		image := ""
		Expect(getIBMCoreImageHashForLabel(image)).To(Equal(""))
	})

	It("truncates digest or tag to 63 characters if it's longer", func() {
		longDigest := "sha256:" + strings.Repeat("a", 100)
		image := "example.com/repo/image@" + longDigest
		result := getIBMCoreImageHashForLabel(image)
		Expect(result).To(HaveLen(63))
	})
})

var _ = Describe("mutateKMMModule", func() {
	var (
		existing *kmmv1beta1.Module
		desired  *kmmv1beta1.Module
		baseSpec kmmv1beta1.ModuleSpec
	)

	BeforeEach(func() {
		// Create a base spec that we'll use for testing
		baseSpec = kmmv1beta1.ModuleSpec{
			ModuleLoader: kmmv1beta1.ModuleLoaderSpec{
				Container: kmmv1beta1.ModuleLoaderContainerSpec{
					ImagePullPolicy: corev1.PullAlways,
					Modprobe: kmmv1beta1.ModprobeSpec{
						ModuleName:          "mmfs26",
						FirmwarePath:        "/opt/lxtrace/",
						DirName:             "/opt",
						ModulesLoadingOrder: []string{"mmfs26", "mmfslinux", "tracedev"},
					},
					RegistryTLS: kmmv1beta1.TLSOptions{
						Insecure:              false,
						InsecureSkipTLSVerify: false,
					},
					KernelMappings: []kmmv1beta1.KernelMapping{{
						Regexp:         "^.*\\.x86_64$",
						ContainerImage: "registry.example.com/gpfs_compat_kmod:v1.0.0-abc123",
						Build: &kmmv1beta1.Build{
							DockerfileConfigMap: &corev1.LocalObjectReference{Name: "kmm-dockerfile"},
							BuildArgs: []kmmv1beta1.BuildArg{{
								Name:  "IBM_SCALE",
								Value: "cp.icr.io/cp/gpfs/ibm-spectrum-scale-core-init@sha256:abc123",
							}},
						},
					}},
				},
				ServiceAccountName: "fusion-access-operator-controller-manager",
			},
			ImageRepoSecret: &corev1.LocalObjectReference{Name: "kmm-registry-push-pull-secret"},
			Selector: map[string]string{
				"kubernetes.io/arch":                  "amd64",
				"scale.spectrum.ibm.com/image-digest": "abc123",
			},
		}

		// Create existing module with base spec
		existing = &kmmv1beta1.Module{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "gpfs-module",
				Namespace: "test-namespace",
			},
			Spec: baseSpec,
		}

		// Create desired module with same base spec
		desired = &kmmv1beta1.Module{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "gpfs-module",
				Namespace: "test-namespace",
			},
			Spec: baseSpec,
		}
	})

	Describe("when specs are identical", func() {
		It("should not modify the existing module", func() {
			originalSpec := existing.Spec.DeepCopy()

			err := mutateKMMModule(existing, desired)

			Expect(err).ToNot(HaveOccurred())
			Expect(existing.Spec).To(Equal(*originalSpec))
		})

		It("should return no error", func() {
			err := mutateKMMModule(existing, desired)
			Expect(err).ToNot(HaveOccurred())
		})
	})

	Describe("when specs are different", func() {
		Context("when ImagePullPolicy differs", func() {
			BeforeEach(func() {
				desired.Spec.ModuleLoader.Container.ImagePullPolicy = corev1.PullIfNotPresent
			})

			It("should update the existing spec to match desired", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec).To(Equal(desired.Spec))
				Expect(existing.Spec.ModuleLoader.Container.ImagePullPolicy).To(Equal(corev1.PullIfNotPresent))
			})
		})

		Context("when ModuleName differs", func() {
			BeforeEach(func() {
				desired.Spec.ModuleLoader.Container.Modprobe.ModuleName = "different-module"
			})

			It("should update the existing spec to match desired", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec).To(Equal(desired.Spec))
				Expect(existing.Spec.ModuleLoader.Container.Modprobe.ModuleName).To(Equal("different-module"))
			})
		})

		Context("when ContainerImage differs", func() {
			BeforeEach(func() {
				desired.Spec.ModuleLoader.Container.KernelMappings[0].ContainerImage = "registry.example.com/gpfs_compat_kmod:v2.0.0-def456"
			})

			It("should update the existing spec to match desired", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec).To(Equal(desired.Spec))
				Expect(existing.Spec.ModuleLoader.Container.KernelMappings[0].ContainerImage).To(Equal("registry.example.com/gpfs_compat_kmod:v2.0.0-def456"))
			})
		})

		Context("when Selector differs", func() {
			BeforeEach(func() {
				desired.Spec.Selector = map[string]string{
					"kubernetes.io/arch":                  "amd64",
					"scale.spectrum.ibm.com/image-digest": "def456",
					"custom-label":                        "custom-value",
				}
			})

			It("should update the existing spec to match desired", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec).To(Equal(desired.Spec))
				Expect(existing.Spec.Selector).To(HaveKeyWithValue("custom-label", "custom-value"))
			})
		})

		Context("when BuildArgs differ", func() {
			BeforeEach(func() {
				desired.Spec.ModuleLoader.Container.KernelMappings[0].Build.BuildArgs = []kmmv1beta1.BuildArg{
					{Name: "IBM_SCALE", Value: "cp.icr.io/cp/gpfs/ibm-spectrum-scale-core-init@sha256:def456"},
					{Name: "EXTRA_ARG", Value: "extra-value"},
				}
			})

			It("should update the existing spec to match desired", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec).To(Equal(desired.Spec))
				Expect(existing.Spec.ModuleLoader.Container.KernelMappings[0].Build.BuildArgs).To(HaveLen(2))
				Expect(existing.Spec.ModuleLoader.Container.KernelMappings[0].Build.BuildArgs[1].Name).To(Equal("EXTRA_ARG"))
			})
		})

		Context("when ServiceAccountName differs", func() {
			BeforeEach(func() {
				desired.Spec.ModuleLoader.ServiceAccountName = "different-service-account"
			})

			It("should update the existing spec to match desired", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec).To(Equal(desired.Spec))
				Expect(existing.Spec.ModuleLoader.ServiceAccountName).To(Equal("different-service-account"))
			})
		})
	})

	Describe("edge cases", func() {
		Context("when existing module has nil ImageRepoSecret", func() {
			BeforeEach(func() {
				existing.Spec.ImageRepoSecret = nil
				desired.Spec.ImageRepoSecret = &corev1.LocalObjectReference{Name: "new-secret"}
			})

			It("should set the ImageRepoSecret on existing", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec.ImageRepoSecret).ToNot(BeNil())
				Expect(existing.Spec.ImageRepoSecret.Name).To(Equal("new-secret"))
			})
		})

		Context("when desired module has nil ImageRepoSecret", func() {
			BeforeEach(func() {
				existing.Spec.ImageRepoSecret = &corev1.LocalObjectReference{Name: "old-secret"}
				desired.Spec.ImageRepoSecret = nil
			})

			It("should set existing ImageRepoSecret to nil", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec.ImageRepoSecret).To(BeNil())
			})
		})

		Context("when existing has empty Selector", func() {
			BeforeEach(func() {
				existing.Spec.Selector = map[string]string{}
				desired.Spec.Selector = map[string]string{"key": "value"}
			})

			It("should update existing selector", func() {
				err := mutateKMMModule(existing, desired)

				Expect(err).ToNot(HaveOccurred())
				Expect(existing.Spec.Selector).To(HaveKeyWithValue("key", "value"))
			})
		})
	})

	Describe("complex changes", func() {
		It("should handle multiple simultaneous changes correctly", func() {
			// Make multiple changes to desired
			desired.Spec.ModuleLoader.Container.ImagePullPolicy = corev1.PullIfNotPresent
			desired.Spec.ModuleLoader.Container.Modprobe.ModuleName = "new-module"
			desired.Spec.ModuleLoader.ServiceAccountName = "new-service-account"
			desired.Spec.Selector = map[string]string{"env": "test"}
			desired.Spec.ImageRepoSecret = &corev1.LocalObjectReference{Name: "new-secret"}

			err := mutateKMMModule(existing, desired)

			Expect(err).ToNot(HaveOccurred())
			Expect(existing.Spec).To(Equal(desired.Spec))

			// Verify all changes were applied
			Expect(existing.Spec.ModuleLoader.Container.ImagePullPolicy).To(Equal(corev1.PullIfNotPresent))
			Expect(existing.Spec.ModuleLoader.Container.Modprobe.ModuleName).To(Equal("new-module"))
			Expect(existing.Spec.ModuleLoader.ServiceAccountName).To(Equal("new-service-account"))
			Expect(existing.Spec.Selector).To(HaveKeyWithValue("env", "test"))
			Expect(existing.Spec.ImageRepoSecret.Name).To(Equal("new-secret"))
		})
	})
})

func TestGetIBMCoreImageHash(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "getIBMCoreImageHash Suite")
}
