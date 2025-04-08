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

package discovery

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	//+kubebuilder:scaffold:imports
)

// These tests use Ginkgo (BDD-style Go testing framework). Refer to
// http://onsi.github.io/ginkgo/ to learn more about Ginkgo.

func TestDevicefinder(t *testing.T) {
	RegisterFailHandler(Fail)

	RunSpecs(t, "Devicefinder Suite")
}

var _ = BeforeSuite(func() {
	logf.SetLogger(zap.New(zap.WriteTo(GinkgoWriter), zap.UseDevMode(true)))

	By("bootstrapping test environment")
	// testEnv = &envtest.Environment{
	// 	CRDDirectoryPaths:     []string{filepath.Join("..", "..", "config", "crd", "bases")},
	// 	ErrorIfCRDPathMissing: true,

	// 	// The BinaryAssetsDirectory is only required if you want to run the tests directly
	// 	// without call the makefile target test. If not informed it will look for the
	// 	// default path defined in controller-runtime which is /usr/local/kubebuilder/.
	// 	// Note that you must have the required binaries setup under the bin directory to perform
	// 	// the tests directly. When we run make test it will be setup and used automatically.
	// 	BinaryAssetsDirectory: filepath.Join("..", "..", "bin", "k8s",
	// 		fmt.Sprintf("1.29.0-%s-%s", runtime.GOOS, runtime.GOARCH)),
	// }

	// var err error
	// // cfg is defined in this file globally.
	// cfg, err = testEnv.Start()
	// Expect(err).NotTo(HaveOccurred())
	// Expect(cfg).NotTo(BeNil())

	// err = fusionv1alpha.AddToScheme(scheme.Scheme)
	// Expect(err).NotTo(HaveOccurred())

	// //+kubebuilder:scaffold:scheme

	// k8sClient, err = client.New(cfg, client.Options{Scheme: scheme.Scheme})
	// Expect(err).NotTo(HaveOccurred())
	// Expect(k8sClient).NotTo(BeNil())

})

var _ = AfterSuite(func() {
	// By("tearing down the test environment")
	// err := testEnv.Stop()
	// Expect(err).NotTo(HaveOccurred())
})

// func createFakeScheme() *kruntime.Scheme {
// 	s := scheme.Scheme
// 	builder := append(kruntime.SchemeBuilder{},
// 		machineconfigv1.AddToScheme,
// 		fusionv1alpha.AddToScheme,
// 		corev1.AddToScheme,
// 		configv1.AddToScheme,
// 	)
// 	Expect(builder.AddToScheme(s)).To(Succeed())
// 	return s
// }
