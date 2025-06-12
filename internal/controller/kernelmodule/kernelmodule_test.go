package kernelmodule

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
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

func TestGetIBMCoreImageHash(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "getIBMCoreImageHash Suite")
}
