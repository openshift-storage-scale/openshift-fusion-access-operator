//nolint:lll
package discovery

import (
	"fmt"
	"os"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/devicefinder"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var _ = Describe("DeviceDiscovery", func() {
	Context("ensureDiscoveryResultCR", func() {
		It("should succeed with valid environment", func() {
			dd := getFakeDeviceDiscovery()
			setEnv()
			defer unsetEnv()
			err := dd.ensureDiscoveryResultCR()
			Expect(err).ToNot(HaveOccurred())
		})

		It("should fail with missing environment variables", func() {
			dd := getFakeDeviceDiscovery()
			err := dd.ensureDiscoveryResultCR()
			Expect(err).To(HaveOccurred())
		})

		It("should fail when getting discovery result object fails", func() {
			mockClient := &devicefinder.MockAPIUpdater{
				MockGetDiscoveryResult: func(name, namespace string) (*v1alpha1.LocalVolumeDiscoveryResult, error) {
					return nil, fmt.Errorf("failed to get result object")
				},
			}

			dd := getFakeDeviceDiscovery()
			dd.apiClient = mockClient
			setEnv()
			defer unsetEnv()
			err := dd.ensureDiscoveryResultCR()
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(Equal("failed to get result object"))
		})
	})

	Context("updateStatus", func() {
		It("should succeed with valid environment", func() {
			dd := getFakeDeviceDiscovery()
			setEnv()
			defer unsetEnv()
			err := dd.updateStatus()
			Expect(err).ToNot(HaveOccurred())
		})

		It("should fail when getting discovery result fails", func() {
			mockClient := &devicefinder.MockAPIUpdater{
				MockGetDiscoveryResult: func(name, namespace string) (*v1alpha1.LocalVolumeDiscoveryResult, error) {
					return nil, fmt.Errorf("failed to get result object")
				},
			}
			dd := getFakeDeviceDiscovery()
			dd.apiClient = mockClient
			setEnv()
			defer unsetEnv()
			err := dd.updateStatus()
			Expect(err).To(HaveOccurred())
		})

		It("should fail when updating discovery result status fails", func() {
			mockClient := &devicefinder.MockAPIUpdater{
				MockUpdateDiscoveryResultStatus: func(lvdr *v1alpha1.LocalVolumeDiscoveryResult) error {
					return fmt.Errorf("failed to update status")
				},
			}
			dd := getFakeDeviceDiscovery()
			dd.apiClient = mockClient
			setEnv()
			defer unsetEnv()
			err := dd.updateStatus()
			Expect(err).To(HaveOccurred())
		})
	})

	Context("newDiscoveryResultInstance", func() {
		DescribeTable("should create correct discovery result instance",
			func(nodeName, namespace, parentObjectName, parentObjectUID string, expected v1alpha1.LocalVolumeDiscoveryResult) {
				actual := newDiscoveryResultInstance(nodeName, namespace, parentObjectName, parentObjectUID)
				Expect(actual.Name).To(Equal(expected.Name))
				Expect(actual.Namespace).To(Equal(expected.Namespace))
				Expect(actual.Labels).To(Equal(expected.Labels))
				Expect(actual.Spec.NodeName).To(Equal(expected.Spec.NodeName))
				Expect(actual.ObjectMeta.OwnerReferences[0].Name).To(Equal(expected.ObjectMeta.OwnerReferences[0].Name))
				Expect(actual.ObjectMeta.OwnerReferences[0].UID).To(Equal(expected.ObjectMeta.OwnerReferences[0].UID))
			},
			Entry("node name less than 253 characters",
				"node1",
				"local-storage",
				"devicefinder-discovery-123",
				"f288b336-434e-4939-b742-9d8fd232a56c",
				v1alpha1.LocalVolumeDiscoveryResult{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "discovery-result-node1",
						Namespace: "local-storage",
						Labels:    map[string]string{"discovery-result-node": "node1"},
						OwnerReferences: []metav1.OwnerReference{
							{
								Name: "devicefinder-discovery-123",
								UID:  "f288b336-434e-4939-b742-9d8fd232a56c",
							},
						},
					},
					Spec: v1alpha1.LocalVolumeDiscoveryResultSpec{
						NodeName: "node1",
					},
				},
			),
			Entry("node name greater than 253 characters",
				"192.168.1.27.ec2.internal.node-name-greater-than-253-characters-1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890",
				"default",
				"devicefinder-discovery-456",
				"f288b336-434e-4939-b742-9d8fd232a56c",
				v1alpha1.LocalVolumeDiscoveryResult{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "discovery-result-d57ec549800941f89ed17bbfcd013459",
						Namespace: "default",
						Labels:    map[string]string{"discovery-result-node": "192.168.1.27.ec2.internal.node-name-greater-than-253-characters-1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890"},
						OwnerReferences: []metav1.OwnerReference{
							{
								Name: "devicefinder-discovery-456",
								UID:  "f288b336-434e-4939-b742-9d8fd232a56c",
							},
						},
					},
					Spec: v1alpha1.LocalVolumeDiscoveryResultSpec{
						NodeName: "192.168.1.27.ec2.internal.node-name-greater-than-253-characters-1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890",
					},
				},
			),
		)
	})

	Context("truncateNodeName", func() {
		DescribeTable("should truncate node names correctly",
			func(input, expected string) {
				actual := truncateNodeName("discovery-result-%s", input)
				Expect(actual).To(Equal(expected))
			},
			Entry("node name is equal to 68 chars",
				"k8s-worker-1234567890.this.is.a.very.very.long.node.name.example.com",
				"discovery-result-k8s-worker-1234567890.this.is.a.very.very.long.node.name.example.com",
			),
			Entry("node name is equal to 5 chars",
				"k8s01",
				"discovery-result-k8s01",
			),
			Entry("node name is equal to 47 chars",
				"k8s-worker-500.this.is.a.not.so.long.name",
				"discovery-result-k8s-worker-500.this.is.a.not.so.long.name",
			),
			Entry("node name is equal to 256 chars",
				"k8s-worker-1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.1234567890.very.very.long.node.name.example.com",
				"discovery-result-5705c7b58bd04799d9ab6aadbde0db3e",
			),
		)
	})
})

func getFakeDeviceDiscovery() *DeviceDiscovery {
	dd := &DeviceDiscovery{}
	dd.apiClient = &devicefinder.MockAPIUpdater{}
	dd.eventSync = devicefinder.NewEventReporter(dd.apiClient)
	dd.disks = []v1alpha1.DiscoveredDevice{}
	dd.localVolumeDiscovery = &v1alpha1.LocalVolumeDiscovery{}

	return dd
}

func setEnv() {
	os.Setenv("MY_NODE_NAME", "node1")
	os.Setenv("WATCH_NAMESPACE", "ns")
	os.Setenv("DISCOVERY_OBJECT_UID", "uid")
	os.Setenv("DISCOVERY_OBJECT_NAME", "auto-discover-devices")
}

func unsetEnv() {
	os.Unsetenv("MY_NODE_NAME")
	os.Unsetenv("WATCH_NAMESPACE")
	os.Unsetenv("DISCOVERY_OBJECT_UID")
	os.Unsetenv("DISCOVERY_OBJECT_NAME")
}
