package controller

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	corev1 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

const TESTNAMESPACE = "test-namespace"

var _ = Describe("FusionAccess Utilities", func() {
	var (
		clientset client.Client
		ctx       context.Context
		scheme    = createFakeScheme()

		fakeClientBuilder *fake.ClientBuilder
	)

	BeforeEach(func() {
		clientset = fake.NewClientBuilder().Build()
		ctx = context.TODO()
		fakeClientBuilder = fake.NewClientBuilder().
			WithScheme(scheme)
	})

	Describe("IbmEntitlementSecrets", func() {
		It("should return the correct IBM namespaces", func() {
			names := IbmEntitlementSecrets(TESTNAMESPACE)
			Expect(names).To(ConsistOf(
				TESTNAMESPACE,
				"ibm-spectrum-scale",
				"ibm-spectrum-scale-dns",
				"ibm-spectrum-scale-csi",
				"ibm-spectrum-scale-operator",
			))
		})
	})

	Describe("newSecret", func() {
		It("should return a properly formed Secret", func() {
			data := map[string][]byte{"foo": []byte("bar")}
			labels := map[string]string{"app": "test"}
			sec := newSecret("my-secret", "default", data, corev1.SecretTypeOpaque, labels)

			Expect(sec.Name).To(Equal("my-secret"))
			Expect(sec.Namespace).To(Equal("default"))
			Expect(sec.Data["foo"]).To(Equal([]byte("bar")))
			Expect(sec.Labels["app"]).To(Equal("test"))
			Expect(sec.Type).To(Equal(corev1.SecretTypeOpaque))
		})
	})

	Describe("getPullSecretContent", func() {
		const secretName = "fusion-pullsecret" //nolint:gosec

		It("should return error if secret doesn't exist", func() {
			_, err := getPullSecretContent(secretName, "default", ctx, clientset)
			Expect(err).To(HaveOccurred())
			Expect(kerrors.IsNotFound(err)).To(BeTrue())
		})

		It("should return error for wrong secret type", func() {
			secret := &corev1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      secretName,
					Namespace: "default",
				},
				Data: map[string][]byte{},
				Type: corev1.SecretTypeDockerConfigJson,
			}

			clientset = fakeClientBuilder.WithRuntimeObjects(secret).Build()
			Expect(clientset).NotTo(BeNil())
			_, err := getPullSecretContent(secretName, "default", ctx, clientset)
			Expect(err).To(MatchError(ContainSubstring("is not of type")))
		})

		It("should return error if ibm-entitlement-key is missing", func() {
			secret := &corev1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      secretName,
					Namespace: "default",
				},
				Data: map[string][]byte{
					"wrong-key": []byte("some-data")},
				Type: corev1.SecretTypeOpaque,
			}
			clientset = fakeClientBuilder.WithRuntimeObjects(secret).Build()
			Expect(clientset).NotTo(BeNil())
			_, err := getPullSecretContent(secretName, "default", ctx, clientset)
			Expect(err).To(MatchError(ContainSubstring("does not contain ibm-entitlement-key")))
		})

		It("should return error if secret data is missing", func() {
			secret := &corev1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      secretName,
					Namespace: "default",
				},
				Data: map[string][]byte{},
				Type: corev1.SecretTypeOpaque,
			}
			clientset = fakeClientBuilder.WithRuntimeObjects(secret).Build()
			Expect(clientset).NotTo(BeNil())
			_, err := getPullSecretContent(secretName, "default", ctx, clientset)
			Expect(err).To(MatchError(ContainSubstring("has no data")))
		})

		It("should return secret content if valid", func() {
			data := map[string][]byte{
				IBMENTITLEMENTNAME: []byte("my-secret-data"),
			}
			secret := &corev1.Secret{
				ObjectMeta: metav1.ObjectMeta{
					Name:      secretName,
					Namespace: "default",
				},
				Data: data,
				Type: corev1.SecretTypeOpaque,
			}
			clientset = fakeClientBuilder.WithRuntimeObjects(secret).Build()
			content, err := getPullSecretContent(secretName, "default", ctx, clientset)
			Expect(err).ToNot(HaveOccurred())
			Expect(content).To(Equal([]byte("my-secret-data")))
		})
	})

	Describe("updateEntitlementPullSecrets", func() {
		var secretData []byte

		BeforeEach(func() {
			secretData = []byte("test-secret-data")
		})

		It("creates secrets in all IBM namespaces if not present", func() {
			err := updateEntitlementPullSecrets(secretData, ctx, clientset, TESTNAMESPACE)
			Expect(err).ToNot(HaveOccurred())

			for _, ns := range IbmEntitlementSecrets(TESTNAMESPACE) {
				secret := &corev1.Secret{}
				err := clientset.Get(ctx, types.NamespacedName{Namespace: ns, Name: IBMENTITLEMENTNAME}, secret)
				Expect(err).ToNot(HaveOccurred())
				dockerConfigJSON, err := getDockerConfigSecretJSON(secretData)
				Expect(err).ToNot(HaveOccurred())
				Expect(secret.Data[".dockerconfigjson"]).To(Equal(dockerConfigJSON))
			}
		})

		It("updates existing secrets", func() {
			// Create dummy existing secrets with wrong data
			for _, ns := range IbmEntitlementSecrets(TESTNAMESPACE) {
				secret := &corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:      IBMENTITLEMENTNAME,
						Namespace: ns,
					},
					Data: map[string][]byte{
						".dockerconfigjson": []byte("old-data")},
					Type: corev1.SecretTypeDockerConfigJson,
				}
				clientset = fakeClientBuilder.WithRuntimeObjects(secret).Build()
			}

			err := updateEntitlementPullSecrets(secretData, ctx, clientset, TESTNAMESPACE)
			Expect(err).ToNot(HaveOccurred())

			for _, ns := range IbmEntitlementSecrets(TESTNAMESPACE) {
				secret := &corev1.Secret{}
				err := clientset.Get(ctx, types.NamespacedName{Namespace: ns, Name: IBMENTITLEMENTNAME}, secret)
				Expect(err).ToNot(HaveOccurred())
				dockerConfigJSON, err := getDockerConfigSecretJSON(secretData)
				Expect(err).ToNot(HaveOccurred())

				Expect(secret.Data[".dockerconfigjson"]).To(Equal(dockerConfigJSON))
			}
		})
	})
})
