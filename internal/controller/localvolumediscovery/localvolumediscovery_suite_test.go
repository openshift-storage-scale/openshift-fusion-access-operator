package localvolumediscovery

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

func TestLocalVolumeDiscovery(t *testing.T) {
	RegisterFailHandler(Fail)

	RunSpecs(t, "LocalVolumeDiscovery Suite")
}

var _ = BeforeSuite(func() {
	logf.SetLogger(zap.New(zap.WriteTo(GinkgoWriter), zap.UseDevMode(true)))

	By("bootstrapping test environment")
})

var _ = AfterSuite(func() {
	By("tearing down the test environment")
})
