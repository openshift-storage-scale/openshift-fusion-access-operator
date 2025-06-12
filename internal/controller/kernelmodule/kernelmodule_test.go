package kernelmodule

import (
	"strings"
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

func TestGetIBMCoreImageHash(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "getIBMCoreImageHash Suite")
}
