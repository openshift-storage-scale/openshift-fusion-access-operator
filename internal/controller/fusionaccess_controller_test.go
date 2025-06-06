/*
Copyright 2025.

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

package controller

import (
	"context"
	"os"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	configv1 "github.com/openshift/api/config/v1"
	operatorv1 "github.com/openshift/api/operator/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	kubeclient "k8s.io/client-go/kubernetes/fake"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	fusionv1alpha "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
)

const (
	resourceName   = "test-resource"
	oscinitVersion = "v4.17.0"
)

var _ = Describe("FusionAccess Controller", func() {
	var (
		fakeClientBuilder *fake.ClientBuilder
		scheme            = createFakeScheme()
		namespace         = newNamespace("ibm-fusion-access-operator")
		version           = newOCPVersion(oscinitVersion)
		clusterConsole    = &operatorv1.Console{ObjectMeta: metav1.ObjectMeta{Name: "cluster"}}
		testTimeout       = 5 * time.Second
	)
	Context("When reconciling a resource", func() {
		const resourceName = "test-resource"

		ctx, cancel := context.WithTimeout(context.Background(), testTimeout)
		defer cancel()

		typeNamespacedName := types.NamespacedName{
			Name:      resourceName,
			Namespace: "default", // TODO(user):Modify as needed
		}

		BeforeEach(func() {
			By("creating the custom resource for the Kind FusionAccess")
			os.Setenv("DEPLOYMENT_NAMESPACE", "ibm-fusion-access-operator")
			fakeClientBuilder = fake.NewClientBuilder().
				WithScheme(scheme).
				WithRuntimeObjects(version, namespace, clusterConsole).
				WithStatusSubresource(&fusionv1alpha.FusionAccess{})

		})

		AfterEach(func() {
			os.Unsetenv("DEPLOYMENT_NAMESPACE")
		})

		It("should successfully reconcile the resource", func() {
			resource := &fusionv1alpha.FusionAccess{
				ObjectMeta: metav1.ObjectMeta{
					Name:      resourceName,
					Namespace: "default",
				},
				Spec: fusionv1alpha.FusionAccessSpec{
					StorageScaleVersion:  "v5.2.3.0.1",
					LocalVolumeDiscovery: fusionv1alpha.StorageDeviceDiscovery{
						// Create: false,
					},
				},
			}
			k8sClient = fakeClientBuilder.WithRuntimeObjects(resource).Build()
			Expect(k8sClient).NotTo(BeNil())

			By("Reconciling the custom resource created")
			FusionAccessReconciler := &FusionAccessReconciler{
				Client:     k8sClient,
				Scheme:     k8sClient.Scheme(),
				fullClient: kubeclient.NewSimpleClientset(),
				CanPullImage: func(ctx context.Context, client kubernetes.Interface, ns, image, pullSecret string) (bool, error) {
					return true, nil
				},
			}

			_, err := FusionAccessReconciler.Reconcile(ctx, reconcile.Request{
				NamespacedName: typeNamespacedName,
			})
			Expect(err).ToNot(HaveOccurred())
			updated := &fusionv1alpha.FusionAccess{}
			err = k8sClient.Get(ctx, typeNamespacedName, updated)
			Expect(err).ToNot(HaveOccurred())
		})
	})
})

var _ = Describe("FusionAccessReconciler Setup", func() {
	var (
		k8sMgr     manager.Manager
		reconciler *FusionAccessReconciler
		scheme     = createFakeScheme()
	)

	BeforeEach(func(ctx context.Context) {
		var err error

		scheme = createFakeScheme()
		_ = clientgoscheme.AddToScheme(scheme)
		_ = fusionv1alpha.AddToScheme(scheme)

		k8sMgr, err = manager.New(cfg, manager.Options{
			Scheme: scheme,
		})
		Expect(err).NotTo(HaveOccurred())
	})

	It("should initialize the reconciler without errors", func() {
		reconciler = &FusionAccessReconciler{}

		err := reconciler.SetupWithManager(k8sMgr)
		Expect(err).NotTo(HaveOccurred())

		Expect(reconciler.config).ToNot(BeNil())
		Expect(reconciler.dynamicClient).ToNot(BeNil())
		Expect(reconciler.fullClient).ToNot(BeNil())

	})
})

var _ = Describe("checkPullSecret", func() {
	const (
		expectedName      = "fusion-pullsecret"
		expectedNamespace = "default"
	)

	It("returns true for a valid pull secret", func() {
		secret := &corev1.Secret{
			Type: corev1.SecretTypeOpaque,
			ObjectMeta: metav1.ObjectMeta{
				Name:      expectedName,
				Namespace: expectedNamespace,
			},
		}

		Expect(checkPullSecret(secret, expectedNamespace)).To(BeTrue())
	})

	It("returns false if secret type is incorrect", func() {
		secret := &corev1.Secret{
			Type: corev1.SecretTypeDockercfg,
			ObjectMeta: metav1.ObjectMeta{
				Name:      expectedName,
				Namespace: expectedNamespace,
			},
		}

		Expect(checkPullSecret(secret, expectedNamespace)).To(BeFalse())
	})

	It("returns false if secret name is incorrect", func() {
		secret := &corev1.Secret{
			Type: corev1.SecretTypeOpaque,
			ObjectMeta: metav1.ObjectMeta{
				Name:      "wrong-name",
				Namespace: expectedNamespace,
			},
		}

		Expect(checkPullSecret(secret, expectedNamespace)).To(BeFalse())
	})

	It("returns false if secret namespace is incorrect", func() {
		secret := &corev1.Secret{
			Type: corev1.SecretTypeOpaque,
			ObjectMeta: metav1.ObjectMeta{
				Name:      expectedName,
				Namespace: "other-namespace",
			},
		}

		Expect(checkPullSecret(secret, expectedNamespace)).To(BeFalse())
	})
})

func newNamespace(name string) *corev1.Namespace {
	return &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: name}}
}

func newOCPVersion(version string) *configv1.ClusterVersion {
	return &configv1.ClusterVersion{
		ObjectMeta: metav1.ObjectMeta{Name: "version"},
		Status: configv1.ClusterVersionStatus{
			History: []configv1.UpdateHistory{
				{State: configv1.CompletedUpdate,
					Version: version},
			},
		},
	}
}

var _ = Describe("FusionAccessReconciler Setup", func() {
})

// Replace these with your actual mocking setup
var _ = Describe("getIbmManifest", func() {
	Context("when ExternalManifestURL is valid", func() {
		It("should return the external URL if allowed", func() {
			fusionObj := fusionv1alpha.FusionAccessSpec{
				ExternalManifestURL: "https://raw.githubusercontent.com/openshift-storage-scale/openshift-fusion-access-manifests/refs/heads/main/manifests/5.2.3.1.dev2/install.yaml",
				StorageScaleVersion: "",
			}

			url, err := getIbmManifest(fusionObj)
			Expect(err).ToNot(HaveOccurred())
			Expect(url).To(Equal("https://raw.githubusercontent.com/openshift-storage-scale/openshift-fusion-access-manifests/refs/heads/main/manifests/5.2.3.1.dev2/install.yaml"))
		})

		It("should return an error if external URL is disallowed", func() {
			fusionObj := fusionv1alpha.FusionAccessSpec{
				ExternalManifestURL: "http://bad-url.com",
				StorageScaleVersion: "",
			}

			_, err := getIbmManifest(fusionObj)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("disallowed URL"))
		})
	})

	Context("when IbmCnsaVersion is set and external URL is empty", func() {
		It("should return the install path", func() {
			fusionObj := fusionv1alpha.FusionAccessSpec{
				ExternalManifestURL: "",
				StorageScaleVersion: "v5.2.3.0.1",
			}

			path, err := getIbmManifest(fusionObj)
			Expect(err).ToNot(HaveOccurred())
			Expect(path).To(Equal("../../files/v5.2.3.0.1/install.yaml"))
		})
	})

	Context("when neither ExternalManifestURL nor StorageScaleVersion is set", func() {
		It("should return an error", func() {
			fusionObj := fusionv1alpha.FusionAccessSpec{}

			_, err := getIbmManifest(fusionObj)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("no CNSA manifest version"))
		})
	})
})
