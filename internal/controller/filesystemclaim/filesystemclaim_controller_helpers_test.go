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

package filesystemclaim

import (
	"context"
	"strings"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

var _ = Describe("FileSystemClaim Helper Functions", func() {

	Describe("generateLocalDiskName", func() {
		Context("with valid WWNs", func() {
			It("should use raw WWN with uuid prefix", func() {
				wwn := "uuid.f18cb32d-1087-55a1-b9bc-4b4d12bcdbf4"

				result, err := generateLocalDiskName(wwn)
				Expect(err).NotTo(HaveOccurred())
				Expect(result).To(Equal("uuid.f18cb32d-1087-55a1-b9bc-4b4d12bcdbf4"))
			})

			It("should use raw WWN with 0x prefix", func() {
				wwn := "0x5002538e00000001"

				result, err := generateLocalDiskName(wwn)
				Expect(err).NotTo(HaveOccurred())
				Expect(result).To(Equal("0x5002538e00000001"))
			})

			It("should use raw WWN with eui prefix", func() {
				wwn := "eui.517c5704-d89f-5bb2-bf11-9ce58152118a"

				result, err := generateLocalDiskName(wwn)
				Expect(err).NotTo(HaveOccurred())
				Expect(result).To(Equal("eui.517c5704-d89f-5bb2-bf11-9ce58152118a"))
			})

			It("should use raw WWN without prefix", func() {
				wwn := "uuid.sda-wwn-456"

				result, err := generateLocalDiskName(wwn)
				Expect(err).NotTo(HaveOccurred())
				Expect(result).To(Equal("uuid.sda-wwn-456"))
			})

			It("should handle WWN without standard prefix", func() {
				wwn := "simple-wwn-without-prefix"

				result, err := generateLocalDiskName(wwn)
				Expect(err).NotTo(HaveOccurred())
				Expect(result).To(Equal("simple-wwn-without-prefix"))
			})
		})

		Context("with invalid inputs", func() {
			It("should return error for empty WWN", func() {
				_, err := generateLocalDiskName("")
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("WWN cannot be empty"))
			})

			It("should return error for WWN that's too long", func() {
				// Create a WWN longer than 253 characters
				longWWN := "uuid." + strings.Repeat("a", 250)
				_, err := generateLocalDiskName(longWWN)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("too long"))
			})
		})
	})

	Describe("isValidKubernetesName", func() {
		Context("with valid names", func() {
			It("should accept valid names", func() {
				Expect(isValidKubernetesName("valid-name")).To(BeTrue())
				Expect(isValidKubernetesName("validname")).To(BeTrue())
				Expect(isValidKubernetesName("valid-name-123")).To(BeTrue())
				Expect(isValidKubernetesName("valid.name")).To(BeTrue())
				Expect(isValidKubernetesName("VALID")).To(BeTrue())
				Expect(isValidKubernetesName("a")).To(BeTrue())
			})
		})

		Context("with invalid names", func() {
			It("should reject invalid names", func() {
				Expect(isValidKubernetesName("")).To(BeFalse())
				Expect(isValidKubernetesName("-invalid")).To(BeFalse())
				Expect(isValidKubernetesName("invalid-")).To(BeFalse())
				Expect(isValidKubernetesName("invalid_name")).To(BeFalse())
				Expect(isValidKubernetesName("invalid@name")).To(BeFalse())
			})
		})
	})

	Describe("buildFilesystemSpec", func() {
		Context("with valid disk names", func() {
			It("should build correct spec for single disk", func() {
				ldNames := []string{"uuid.test-wwn-123"}

				spec := buildFilesystemSpec(ldNames)

				Expect(spec).To(HaveKey("local"))
				local := spec["local"].(map[string]any)

				Expect(local).To(HaveKey("blockSize"))
				Expect(local["blockSize"]).To(Equal("4M"))

				Expect(local).To(HaveKey("replication"))
				Expect(local["replication"]).To(Equal("1-way"))

				Expect(local).To(HaveKey("type"))
				Expect(local["type"]).To(Equal("shared"))

				Expect(local).To(HaveKey("pools"))
				pools := local["pools"].([]any)
				Expect(pools).To(HaveLen(1))

				pool := pools[0].(map[string]any)
				Expect(pool["name"]).To(Equal("system"))
				Expect(pool["disks"]).To(Equal([]any{"uuid.test-wwn-123"}))
			})

			It("should build correct spec for multiple disks", func() {
				ldNames := []string{"uuid.wwn1", "eui.wwn2", "0xwwn3"}

				spec := buildFilesystemSpec(ldNames)

				local := spec["local"].(map[string]any)
				pools := local["pools"].([]any)
				pool := pools[0].(map[string]any)

				expectedDisks := []any{"uuid.wwn1", "eui.wwn2", "0xwwn3"}
				Expect(pool["disks"]).To(Equal(expectedDisks))
			})

			It("should include seLinuxOptions", func() {
				ldNames := []string{"uuid.test-wwn-123"}

				spec := buildFilesystemSpec(ldNames)

				Expect(spec).To(HaveKey("seLinuxOptions"))
				seLinux := spec["seLinuxOptions"].(map[string]any)

				Expect(seLinux["level"]).To(Equal("s0"))
				Expect(seLinux["role"]).To(Equal("object_r"))
				Expect(seLinux["type"]).To(Equal("container_file_t"))
				Expect(seLinux["user"]).To(Equal("system_u"))
			})
		})
	})

	Describe("asMetaConditions", func() {
		Context("with valid condition data", func() {
			It("should convert unstructured conditions to metav1.Condition", func() {
				conditions := []any{
					map[string]any{
						"type":               "Ready",
						"status":             "True",
						"reason":             "TestReason",
						"message":            "Test message",
						"lastTransitionTime": "2023-01-01T00:00:00Z",
					},
					map[string]any{
						"type":               "Available",
						"status":             "False",
						"reason":             "TestReason2",
						"message":            "Test message 2",
						"lastTransitionTime": "2023-01-02T00:00:00Z",
					},
				}

				result := asMetaConditions(conditions)

				Expect(result).To(HaveLen(2))

				Expect(result[0].Type).To(Equal("Ready"))
				Expect(result[0].Status).To(Equal(metav1.ConditionTrue))
				Expect(result[0].Reason).To(Equal("TestReason"))
				Expect(result[0].Message).To(Equal("Test message"))

				Expect(result[1].Type).To(Equal("Available"))
				Expect(result[1].Status).To(Equal(metav1.ConditionFalse))
				Expect(result[1].Reason).To(Equal("TestReason2"))
				Expect(result[1].Message).To(Equal("Test message 2"))
			})

			It("should handle empty conditions", func() {
				result := asMetaConditions([]any{})
				Expect(result).To(BeEmpty())
			})

			It("should skip invalid condition entries", func() {
				conditions := []any{
					map[string]any{
						"type":   "Valid",
						"status": "True",
					},
					"invalid-string",
					map[string]any{
						"type":   "AnotherValid",
						"status": "False",
					},
				}

				result := asMetaConditions(conditions)
				Expect(result).To(HaveLen(2))
				Expect(result[0].Type).To(Equal("Valid"))
				Expect(result[1].Type).To(Equal("AnotherValid"))
			})
		})
	})

	Describe("isOwnedByThisFSC", func() {
		Context("with valid owner references", func() {
			It("should return true for matching FSC owner", func() {
				obj := &unstructured.Unstructured{}
				obj.SetOwnerReferences([]metav1.OwnerReference{
					{
						APIVersion: "fusion.storage.openshift.io/v1alpha1",
						Kind:       "FileSystemClaim",
						Name:       "test-fsc",
					},
				})

				result := isOwnedByThisFSC(obj, "test-fsc")
				Expect(result).To(BeTrue())
			})

			It("should return false for non-matching FSC owner", func() {
				obj := &unstructured.Unstructured{}
				obj.SetOwnerReferences([]metav1.OwnerReference{
					{
						APIVersion: "fusion.storage.openshift.io/v1alpha1",
						Kind:       "FileSystemClaim",
						Name:       "other-fsc",
					},
				})

				result := isOwnedByThisFSC(obj, "test-fsc")
				Expect(result).To(BeFalse())
			})

			It("should return false for non-FSC owner", func() {
				obj := &unstructured.Unstructured{}
				obj.SetOwnerReferences([]metav1.OwnerReference{
					{
						APIVersion: "apps/v1",
						Kind:       "Deployment",
						Name:       "test-deployment",
					},
				})

				result := isOwnedByThisFSC(obj, "test-fsc")
				Expect(result).To(BeFalse())
			})

			It("should return false for no owner references", func() {
				obj := &unstructured.Unstructured{}
				obj.SetOwnerReferences([]metav1.OwnerReference{})

				result := isOwnedByThisFSC(obj, "test-fsc")
				Expect(result).To(BeFalse())
			})
		})
	})

	Describe("hasConditionWithReason", func() {
		var reconciler *FileSystemClaimReconciler

		BeforeEach(func() {
			reconciler = &FileSystemClaimReconciler{}
		})

		Context("when checking for condition with specific reason", func() {
			It("should return true when condition exists with matching reason", func() {
				conditions := []metav1.Condition{
					{
						Type:   "DeletionBlocked",
						Status: metav1.ConditionTrue,
						Reason: "StorageClassInUse",
					},
				}

				result := reconciler.hasConditionWithReason(conditions, "DeletionBlocked", "StorageClassInUse")
				Expect(result).To(BeTrue())
			})

			It("should return false when condition exists with different reason", func() {
				conditions := []metav1.Condition{
					{
						Type:   "DeletionBlocked",
						Status: metav1.ConditionTrue,
						Reason: "StorageClassInUse",
					},
				}

				result := reconciler.hasConditionWithReason(conditions, "DeletionBlocked", "FileSystemLabelNotPresent")
				Expect(result).To(BeFalse())
			})

			It("should return false when condition does not exist", func() {
				conditions := []metav1.Condition{}

				result := reconciler.hasConditionWithReason(conditions, "DeletionBlocked", "StorageClassInUse")
				Expect(result).To(BeFalse())
			})
		})
	})

	Describe("getDevicePathFromWWN", func() {
		var ctx context.Context

		BeforeEach(func() {
			ctx = context.Background()
		})

		It("should return device path for WWN", func() {
			operatorNS := "test-operator"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node1",
					Labels: map[string]string{
						"node-role.kubernetes.io/worker": "",
						"scale.spectrum.ibm.com/role":    "storage",
					},
				},
			}

			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node1",
					Namespace: operatorNS,
				},
				Spec: fusionv1alpha1.LocalVolumeDiscoveryResultSpec{
					NodeName: "storage-node1",
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							WWN:      "uuid.12345678-abcd-1234-abcd-123456789abc",
							DeviceID: "/dev/disk/by-id/nvme-uuid.12345678-abcd-1234-abcd-123456789abc",
							Path:     "/dev/nvme0n1",
						},
					},
				},
			}

			scheme := runtime.NewScheme()
			Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
			Expect(fusionv1alpha1.AddToScheme(scheme)).To(Succeed())
			Expect(corev1.AddToScheme(scheme)).To(Succeed())

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(node, lvdr).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			devicePath, err := reconciler.getDevicePathFromWWN(ctx, "uuid.12345678-abcd-1234-abcd-123456789abc", "storage-node1")
			Expect(err).NotTo(HaveOccurred())
			Expect(devicePath).To(Equal("/dev/nvme0n1"))
		})

		It("should return error when WWN not found in LVDR", func() {
			operatorNS := "test-operator"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node1",
					Labels: map[string]string{
						"node-role.kubernetes.io/worker": "",
						"scale.spectrum.ibm.com/role":    "storage",
					},
				},
			}

			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node1",
					Namespace: operatorNS,
				},
				Spec: fusionv1alpha1.LocalVolumeDiscoveryResultSpec{
					NodeName: "storage-node1",
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							WWN:      "uuid.different-wwn",
							DeviceID: "/dev/disk/by-id/nvme-different",
							Path:     "/dev/sda",
						},
					},
				},
			}

			scheme := runtime.NewScheme()
			Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
			Expect(fusionv1alpha1.AddToScheme(scheme)).To(Succeed())
			Expect(corev1.AddToScheme(scheme)).To(Succeed())

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(node, lvdr).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			devicePath, err := reconciler.getDevicePathFromWWN(ctx, "uuid.nonexistent-wwn", "storage-node1")
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("not found"))
			Expect(devicePath).To(BeEmpty())
		})

		type incompleteDataTestCase struct {
			description    string
			lvdrNodeName   string
			devicePath     string
			errorSubstring string
		}

		DescribeTable("should return error when LVDR data is incomplete",
			func(tc incompleteDataTestCase) {
				operatorNS := "test-operator"
				GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

				node := &corev1.Node{
					ObjectMeta: metav1.ObjectMeta{
						Name: "storage-node1",
						Labels: map[string]string{
							"node-role.kubernetes.io/worker": "",
							"scale.spectrum.ibm.com/role":    "storage",
						},
					},
				}

				lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "discovery-result-storage-node1",
						Namespace: operatorNS,
					},
					Spec: fusionv1alpha1.LocalVolumeDiscoveryResultSpec{
						NodeName: tc.lvdrNodeName,
					},
					Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
						DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
							{
								WWN:      "uuid.12345678-abcd-1234-abcd-123456789abc",
								DeviceID: "/dev/disk/by-id/nvme-uuid.12345678-abcd-1234-abcd-123456789abc",
								Path:     tc.devicePath,
							},
						},
					},
				}

				scheme := runtime.NewScheme()
				Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
				Expect(fusionv1alpha1.AddToScheme(scheme)).To(Succeed())
				Expect(corev1.AddToScheme(scheme)).To(Succeed())

				fakeClient := fake.NewClientBuilder().
					WithScheme(scheme).
					WithObjects(node, lvdr).
					Build()

				reconciler := &FileSystemClaimReconciler{
					Client: fakeClient,
					Scheme: scheme,
				}

				devicePath, err := reconciler.getDevicePathFromWWN(ctx, "uuid.12345678-abcd-1234-abcd-123456789abc", "storage-node1")
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring(tc.errorSubstring))
				Expect(err.Error()).To(ContainSubstring("incomplete or corrupted"))
				Expect(devicePath).To(BeEmpty())
			},
			Entry("when Path field is empty",
				incompleteDataTestCase{
					description:    "should return error when Path field is empty",
					lvdrNodeName:   "storage-node1",
					devicePath:     "",
					errorSubstring: "Path field is empty",
				},
			),
			Entry("when spec.nodeName is empty",
				incompleteDataTestCase{
					description:    "should return error when spec.nodeName is empty",
					lvdrNodeName:   "",
					devicePath:     "/dev/nvme0n1",
					errorSubstring: "empty spec.nodeName",
				},
			),
		)

		It("should return NotFound error when LocalVolumeDiscoveryResult is missing", func() {
			operatorNS := "test-operator"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			// Create a storage node so validateDevices can find it,
			// but do NOT create a corresponding LocalVolumeDiscoveryResult.
			// This should force the LVDR client Get() to return a NotFound error.
			storageNode := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "node-without-lvdr",
					Labels: map[string]string{
						"node-role.kubernetes.io/worker": "",
						"scale.spectrum.ibm.com/role":    "storage",
					},
				},
			}

			scheme := runtime.NewScheme()
			Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
			Expect(fusionv1alpha1.AddToScheme(scheme)).To(Succeed())
			Expect(corev1.AddToScheme(scheme)).To(Succeed())

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(storageNode).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// Act: attempt to resolve device path for some WWN. Because there is
			// no LocalVolumeDiscoveryResult for this node, the underlying Get()
			// call should return a NotFound error which the controller checks and wraps.
			devicePath, err := reconciler.getDevicePathFromWWN(ctx, "wwn-missing-lvdr", "node-without-lvdr")
			Expect(err).To(HaveOccurred())

			// The controller checks for NotFound using errors.IsNotFound and wraps it
			// with a specific error message. We verify the NotFound path was taken by
			// checking the error message content, which covers the exact NotFound path
			// and message formatting in getDevicePathFromWWN.
			Expect(err.Error()).To(ContainSubstring("LocalVolumeDiscoveryResult"))
			Expect(err.Error()).To(ContainSubstring("not found"))

			// No device path should be returned on error.
			Expect(devicePath).To(BeEmpty())
		})

		It("should return error when LVDR nodeName does not match storageNodeName", func() {
			operatorNS := "test-operator"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node1",
					Labels: map[string]string{
						"node-role.kubernetes.io/worker": "",
						"scale.spectrum.ibm.com/role":    "storage",
					},
				},
			}

			// Create LVDR with mismatched nodeName (different from the node name)
			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node1",
					Namespace: operatorNS,
				},
				Spec: fusionv1alpha1.LocalVolumeDiscoveryResultSpec{
					NodeName: "different-node-name", // Mismatch!
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							WWN:      "uuid.12345678-abcd-1234-abcd-123456789abc",
							DeviceID: "/dev/disk/by-id/nvme-uuid.12345678-abcd-1234-abcd-123456789abc",
							Path:     "/dev/nvme0n1",
						},
					},
				},
			}

			scheme := runtime.NewScheme()
			Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
			Expect(fusionv1alpha1.AddToScheme(scheme)).To(Succeed())
			Expect(corev1.AddToScheme(scheme)).To(Succeed())

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(node, lvdr).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// Act: attempt to get device path with storageNodeName that doesn't match LVDR's nodeName
			devicePath, err := reconciler.getDevicePathFromWWN(ctx, "uuid.12345678-abcd-1234-abcd-123456789abc", "storage-node1")
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("does not match"))
			Expect(err.Error()).To(ContainSubstring("data inconsistency"))

			// No device path should be returned on error.
			Expect(devicePath).To(BeEmpty())
		})
	})

	Describe("calculateDeletionBackoff", func() {
		var reconciler *FileSystemClaimReconciler
		var fsc *fusionv1alpha1.FileSystemClaim

		BeforeEach(func() {
			reconciler = &FileSystemClaimReconciler{}
			fsc = &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: "test-ns",
				},
			}
		})

		Context("when calculating backoff duration", func() {
			It("should return initial delay when condition does not exist", func() {
				fsc.Status.Conditions = []metav1.Condition{}

				duration := reconciler.calculateDeletionBackoff(fsc, "StorageClassInUse")
				Expect(duration).To(Equal(30 * time.Second))
			})

			It("should return initial delay when reason does not match", func() {
				fsc.Status.Conditions = []metav1.Condition{
					{
						Type:               "DeletionBlocked",
						Status:             metav1.ConditionTrue,
						Reason:             "FileSystemLabelNotPresent",
						LastTransitionTime: metav1.Now(),
					},
				}

				duration := reconciler.calculateDeletionBackoff(fsc, "StorageClassInUse")
				Expect(duration).To(Equal(30 * time.Second))
			})

			It("should return 1 minute after 30 seconds elapsed", func() {
				fsc.Status.Conditions = []metav1.Condition{
					{
						Type:               "DeletionBlocked",
						Status:             metav1.ConditionTrue,
						Reason:             "StorageClassInUse",
						LastTransitionTime: metav1.Time{Time: time.Now().Add(-40 * time.Second)},
					},
				}

				duration := reconciler.calculateDeletionBackoff(fsc, "StorageClassInUse")
				Expect(duration).To(Equal(1 * time.Minute))
			})

			It("should return 2 minutes after 2 minutes elapsed", func() {
				fsc.Status.Conditions = []metav1.Condition{
					{
						Type:               "DeletionBlocked",
						Status:             metav1.ConditionTrue,
						Reason:             "StorageClassInUse",
						LastTransitionTime: metav1.Time{Time: time.Now().Add(-2 * time.Minute)},
					},
				}

				duration := reconciler.calculateDeletionBackoff(fsc, "StorageClassInUse")
				Expect(duration).To(Equal(2 * time.Minute))
			})

			It("should cap at 10 minutes for long elapsed time", func() {
				fsc.Status.Conditions = []metav1.Condition{
					{
						Type:               "DeletionBlocked",
						Status:             metav1.ConditionTrue,
						Reason:             "StorageClassInUse",
						LastTransitionTime: metav1.Time{Time: time.Now().Add(-1 * time.Hour)},
					},
				}

				duration := reconciler.calculateDeletionBackoff(fsc, "StorageClassInUse")
				Expect(duration).To(Equal(10 * time.Minute))
			})
		})
	})
})
