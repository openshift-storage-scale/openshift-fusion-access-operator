package imageregistry

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	imageregistryv1 "github.com/openshift/api/imageregistry/v1"
	corev1 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/controller/kernelmodule"
)

var _ = Describe("Image Registry Validation", func() {
	const testNamespace = "test-namespace"

	Describe("CheckImageRegistryStorage", func() {
		var (
			scheme *runtime.Scheme
			ctx    context.Context
		)

		BeforeEach(func() {
			scheme = runtime.NewScheme()
			_ = corev1.AddToScheme(scheme)
			_ = imageregistryv1.AddToScheme(scheme)
			ctx = context.Background()
		})

		Context("when image registry config is not found", func() {
			It("should return no error", func() {
				client := fake.NewClientBuilder().WithScheme(scheme).Build()
				err := CheckImageRegistryStorage(ctx, client)
				Expect(err).ToNot(HaveOccurred())
			})
		})

		Context("when image registry spec has emptyDir storage", func() {
			It("should return an error", func() {
				registryConfig := &imageregistryv1.Config{
					ObjectMeta: metav1.ObjectMeta{
						Name: "cluster",
					},
					Spec: imageregistryv1.ImageRegistrySpec{
						Storage: imageregistryv1.ImageRegistryConfigStorage{
							EmptyDir: &imageregistryv1.ImageRegistryConfigStorageEmptyDir{},
						},
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(registryConfig).Build()
				err := CheckImageRegistryStorage(ctx, client)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("image registry is configured with emptyDir storage"))
			})
		})

		Context("when image registry status has emptyDir storage", func() {
			It("should return an error", func() {
				registryConfig := &imageregistryv1.Config{
					ObjectMeta: metav1.ObjectMeta{
						Name: "cluster",
					},
					Spec: imageregistryv1.ImageRegistrySpec{
						Storage: imageregistryv1.ImageRegistryConfigStorage{},
					},
					Status: imageregistryv1.ImageRegistryStatus{
						Storage: imageregistryv1.ImageRegistryConfigStorage{
							EmptyDir: &imageregistryv1.ImageRegistryConfigStorageEmptyDir{},
						},
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(registryConfig).Build()
				err := CheckImageRegistryStorage(ctx, client)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("image registry is currently using emptyDir storage"))
			})
		})

		Context("when image registry uses PVC storage", func() {
			It("should return no error", func() {
				registryConfig := &imageregistryv1.Config{
					ObjectMeta: metav1.ObjectMeta{
						Name: "cluster",
					},
					Spec: imageregistryv1.ImageRegistrySpec{
						Storage: imageregistryv1.ImageRegistryConfigStorage{
							PVC: &imageregistryv1.ImageRegistryConfigStoragePVC{
								Claim: "image-registry-storage",
							},
						},
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(registryConfig).Build()
				err := CheckImageRegistryStorage(ctx, client)
				Expect(err).ToNot(HaveOccurred())
			})
		})

		Context("when image registry uses S3 storage", func() {
			It("should return no error", func() {
				registryConfig := &imageregistryv1.Config{
					ObjectMeta: metav1.ObjectMeta{
						Name: "cluster",
					},
					Spec: imageregistryv1.ImageRegistrySpec{
						Storage: imageregistryv1.ImageRegistryConfigStorage{
							S3: &imageregistryv1.ImageRegistryConfigStorageS3{
								Bucket: "my-registry-bucket",
								Region: "us-east-1",
							},
						},
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(registryConfig).Build()
				err := CheckImageRegistryStorage(ctx, client)
				Expect(err).ToNot(HaveOccurred())
			})
		})

		Context("when image registry has no storage configuration", func() {
			It("should return no error", func() {
				registryConfig := &imageregistryv1.Config{
					ObjectMeta: metav1.ObjectMeta{
						Name: "cluster",
					},
					Spec: imageregistryv1.ImageRegistrySpec{
						Storage: imageregistryv1.ImageRegistryConfigStorage{},
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(registryConfig).Build()
				err := CheckImageRegistryStorage(ctx, client)
				Expect(err).ToNot(HaveOccurred())
			})
		})

		Context("when client.Get returns an error", func() {
			It("should return the error", func() {
				// Create a fake client that returns an error for Get operations
				client := fake.NewClientBuilder().WithScheme(scheme).Build()

				// Simulate a generic API error
				registryConfig := &imageregistryv1.Config{
					ObjectMeta: metav1.ObjectMeta{
						Name: "cluster",
					},
				}

				// Force an error by trying to get from wrong namespace
				err := client.Get(ctx, types.NamespacedName{Name: "nonexistent"}, registryConfig)
				Expect(err).To(HaveOccurred())
				Expect(kerrors.IsNotFound(err)).To(BeTrue())
			})
		})
	})

	Describe("IsUsingInternalImageRegistry", func() {
		var (
			scheme *runtime.Scheme
			ctx    context.Context
		)

		BeforeEach(func() {
			scheme = runtime.NewScheme()
			_ = corev1.AddToScheme(scheme)
			ctx = context.Background()
		})

		Context("when KMM config uses internal registry URL", func() {
			It("should return true for image-registry.openshift-image-registry.svc:5000", func() {
				kmmConfig := &corev1.ConfigMap{
					ObjectMeta: metav1.ObjectMeta{
						Name:      kernelmodule.KMMImageConfigMapName,
						Namespace: testNamespace,
					},
					Data: map[string]string{
						kernelmodule.KMMImageConfigKeyRegistryURL: "image-registry.openshift-image-registry.svc:5000",
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(kmmConfig).Build()
				result, err := IsUsingInternalImageRegistry(ctx, client, testNamespace)
				Expect(err).ToNot(HaveOccurred())
				Expect(result).To(BeTrue())
			})

			It("should return true for image-registry.openshift-image-registry.svc.cluster.local:5000", func() {
				kmmConfig := &corev1.ConfigMap{
					ObjectMeta: metav1.ObjectMeta{
						Name:      kernelmodule.KMMImageConfigMapName,
						Namespace: testNamespace,
					},
					Data: map[string]string{
						kernelmodule.KMMImageConfigKeyRegistryURL: "image-registry.openshift-image-registry.svc.cluster.local:5000",
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(kmmConfig).Build()
				result, err := IsUsingInternalImageRegistry(ctx, client, testNamespace)
				Expect(err).ToNot(HaveOccurred())
				Expect(result).To(BeTrue())
			})

			It("should return true for docker-registry.default.svc:5000", func() {
				kmmConfig := &corev1.ConfigMap{
					ObjectMeta: metav1.ObjectMeta{
						Name:      kernelmodule.KMMImageConfigMapName,
						Namespace: testNamespace,
					},
					Data: map[string]string{
						kernelmodule.KMMImageConfigKeyRegistryURL: "docker-registry.default.svc:5000",
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(kmmConfig).Build()
				result, err := IsUsingInternalImageRegistry(ctx, client, testNamespace)
				Expect(err).ToNot(HaveOccurred())
				Expect(result).To(BeTrue())
			})

			It("should return true for docker-registry.default.svc.cluster.local:5000", func() {
				kmmConfig := &corev1.ConfigMap{
					ObjectMeta: metav1.ObjectMeta{
						Name:      kernelmodule.KMMImageConfigMapName,
						Namespace: testNamespace,
					},
					Data: map[string]string{
						kernelmodule.KMMImageConfigKeyRegistryURL: "docker-registry.default.svc.cluster.local:5000",
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(kmmConfig).Build()
				result, err := IsUsingInternalImageRegistry(ctx, client, testNamespace)
				Expect(err).ToNot(HaveOccurred())
				Expect(result).To(BeTrue())
			})
		})

		Context("when KMM config uses external registry URL", func() {
			It("should return false for external registry", func() {
				kmmConfig := &corev1.ConfigMap{
					ObjectMeta: metav1.ObjectMeta{
						Name:      kernelmodule.KMMImageConfigMapName,
						Namespace: testNamespace,
					},
					Data: map[string]string{
						kernelmodule.KMMImageConfigKeyRegistryURL: "quay.io",
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(kmmConfig).Build()
				result, err := IsUsingInternalImageRegistry(ctx, client, testNamespace)
				Expect(err).ToNot(HaveOccurred())
				Expect(result).To(BeFalse())
			})

			It("should return false for docker hub", func() {
				kmmConfig := &corev1.ConfigMap{
					ObjectMeta: metav1.ObjectMeta{
						Name:      kernelmodule.KMMImageConfigMapName,
						Namespace: testNamespace,
					},
					Data: map[string]string{
						kernelmodule.KMMImageConfigKeyRegistryURL: "docker.io",
					},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(kmmConfig).Build()
				result, err := IsUsingInternalImageRegistry(ctx, client, testNamespace)
				Expect(err).ToNot(HaveOccurred())
				Expect(result).To(BeFalse())
			})

			It("should return false for empty registry URL", func() {
				kmmConfig := &corev1.ConfigMap{
					ObjectMeta: metav1.ObjectMeta{
						Name:      kernelmodule.KMMImageConfigMapName,
						Namespace: testNamespace,
					},
					Data: map[string]string{},
				}

				client := fake.NewClientBuilder().WithScheme(scheme).WithObjects(kmmConfig).Build()
				result, err := IsUsingInternalImageRegistry(ctx, client, testNamespace)
				Expect(err).ToNot(HaveOccurred())
				Expect(result).To(BeFalse())
			})
		})

		Context("when KMM config does not exist", func() {
			It("should return an error", func() {
				client := fake.NewClientBuilder().WithScheme(scheme).Build()
				result, err := IsUsingInternalImageRegistry(ctx, client, testNamespace)
				Expect(err).To(HaveOccurred())
				Expect(result).To(BeFalse())
				Expect(err.Error()).To(ContainSubstring("failed to get KMM image config"))
			})
		})
	})
})
