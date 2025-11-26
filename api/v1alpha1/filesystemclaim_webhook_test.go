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

package v1alpha1

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var _ = Describe("FileSystemClaim Webhook", func() {
	var (
		validator *FileSystemClaimValidator
		ctx       context.Context
	)

	BeforeEach(func() {
		ctx = context.Background()
		validator = &FileSystemClaimValidator{}
	})

	Describe("ValidateCreate", func() {
		Context("with valid device IDs", func() {
			It("should allow creation with valid device IDs", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{
							"/dev/disk/by-id/nvme-Amazon_EC2_NVMe_Instance_Storage_AWS1234567890ABCDEF0",
							"/dev/disk/by-id/nvme-Amazon_EC2_NVMe_Instance_Storage_AWS1234567890ABCDEF1",
						},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).NotTo(HaveOccurred())
				Expect(warnings).To(BeNil())
			})

			It("should reject device IDs with leading whitespace", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc-whitespace",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{
							"  /dev/disk/by-id/nvme-device-0",
						},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred(), "should reject device IDs with leading whitespace")
				Expect(err.Error()).To(ContainSubstring("spec.devices[0]"))
				Expect(err.Error()).To(ContainSubstring("/dev/disk/by-id/"))
				Expect(warnings).To(BeNil())
			})
		})

		Context("with invalid device paths instead of IDs", func() {
			It("should reject creation with /dev/sda", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{"/dev/sda"},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices[0]"))
				Expect(err.Error()).To(ContainSubstring("/dev/sda"))
				Expect(err.Error()).To(ContainSubstring("/dev/disk/by-id/"))
				Expect(warnings).To(BeNil())
			})

			It("should reject creation with /dev/nvme0n1", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{"/dev/nvme0n1"},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices[0]"))
				Expect(err.Error()).To(ContainSubstring("/dev/nvme0n1"))
				Expect(warnings).To(BeNil())
			})

			It("should reject creation when second device is invalid path", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{
							"/dev/disk/by-id/nvme-valid-device",
							"/dev/sdb", // Invalid at index 1
						},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices[1]"))
				Expect(err.Error()).To(ContainSubstring("/dev/sdb"))
				Expect(warnings).To(BeNil())
			})
		})

		Context("with duplicate devices", func() {
			It("should reject creation with duplicate device IDs", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{
							"/dev/disk/by-id/nvme-Amazon_EC2_NVMe_Instance_Storage_AWS1234567890ABCDEF0",
							"/dev/disk/by-id/nvme-Amazon_EC2_NVMe_Instance_Storage_AWS1234567890ABCDEF0",
						},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices[1]"))
				Expect(err.Error()).To(ContainSubstring("duplicate"))
				Expect(warnings).To(BeNil())
			})

			It("should report correct index for duplicate", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{
							"/dev/disk/by-id/device-a",
							"/dev/disk/by-id/device-b",
							"/dev/disk/by-id/device-a", // Duplicate at index 2
						},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices[2]"))
				Expect(err.Error()).To(ContainSubstring("duplicate"))
				Expect(warnings).To(BeNil())
			})
		})

		Context("with empty or blank devices", func() {
			It("should reject creation when devices list is empty", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices cannot be empty"))
				Expect(warnings).To(BeNil())
			})

			It("should reject creation when device is blank/empty", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{""},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices[0] cannot be blank/empty"))
				Expect(warnings).To(BeNil())
			})

			It("should reject creation when devices list contains whitespace-only entries", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc-whitespace",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{" ", "\t", " \t "},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices[0] cannot be blank/empty"))
				Expect(warnings).To(BeNil())
			})

			It("should reject creation when one of multiple devices is blank", func() {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: []string{"/dev/disk/by-id/nvme-device-0", ""},
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).To(HaveOccurred())
				Expect(err.Error()).To(ContainSubstring("spec.devices[1] cannot be blank/empty"))
				Expect(warnings).To(BeNil())
			})
		})
	})

	Describe("ValidateUpdate", func() {
		type updateTestCase struct {
			description     string
			oldDevices      []string
			newDevices      []string
			oldConditions   []metav1.Condition
			expectError     bool
			errorSubstrings []string
		}

		DescribeTable("device update validation",
			func(tc updateTestCase) {
				oldFSC := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: tc.oldDevices,
					},
					Status: FileSystemClaimStatus{
						Conditions: tc.oldConditions,
					},
				}

				newFSC := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: tc.newDevices,
					},
				}

				warnings, err := validator.ValidateUpdate(ctx, oldFSC, newFSC)

				if tc.expectError {
					Expect(err).To(HaveOccurred(), tc.description)
					for _, substr := range tc.errorSubstrings {
						Expect(err.Error()).To(ContainSubstring(substr), tc.description)
					}
				} else {
					Expect(err).NotTo(HaveOccurred(), tc.description)
				}
				Expect(warnings).To(BeNil())
			},
			// Allow updates when LocalDiskCreated is not True
			Entry("allow update when no status conditions exist",
				updateTestCase{
					description:   "should allow device update when no status conditions exist",
					oldDevices:    []string{"/dev/disk/by-id/nvme-invalid-device"},
					newDevices:    []string{"/dev/disk/by-id/nvme-valid-device"},
					oldConditions: []metav1.Condition{},
					expectError:   false,
				},
			),
			Entry("allow update when DeviceValidated=False",
				updateTestCase{
					description: "should allow device update when DeviceValidated=False",
					oldDevices:  []string{"/dev/disk/by-id/nvme-invalid-device"},
					newDevices:  []string{"/dev/disk/by-id/nvme-valid-device"},
					oldConditions: []metav1.Condition{
						{
							Type:   "DeviceValidated",
							Status: metav1.ConditionFalse,
							Reason: "DeviceValidationFailed",
						},
					},
					expectError: false,
				},
			),
			Entry("allow update when LocalDiskCreated=False",
				updateTestCase{
					description: "should allow device update when LocalDiskCreated=False",
					oldDevices:  []string{"/dev/disk/by-id/nvme-device-0", "/dev/disk/by-id/nvme-invalid"},
					newDevices:  []string{"/dev/disk/by-id/nvme-device-0", "/dev/disk/by-id/nvme-device-1"},
					oldConditions: []metav1.Condition{
						{
							Type:   "DeviceValidated",
							Status: metav1.ConditionFalse,
							Reason: "DeviceValidationFailed",
						},
						{
							Type:   "LocalDiskCreated",
							Status: metav1.ConditionFalse,
							Reason: "LocalDiskCreationInProgress",
						},
					},
					expectError: false,
				},
			),

			// Reject device path format on update
			Entry("reject update with device path instead of ID",
				updateTestCase{
					description:     "should reject update with device path instead of ID",
					oldDevices:      []string{"/dev/disk/by-id/nvme-device-0"},
					newDevices:      []string{"/dev/nvme1n1"},
					oldConditions:   []metav1.Condition{},
					expectError:     true,
					errorSubstrings: []string{"spec.devices[0]", "/dev/nvme1n1", "/dev/disk/by-id/"},
				},
			),

			// Reject duplicates on update
			Entry("reject update with duplicate devices",
				updateTestCase{
					description: "should reject update with duplicate devices",
					oldDevices:  []string{"/dev/disk/by-id/nvme-device-0"},
					newDevices: []string{
						"/dev/disk/by-id/nvme-device-1",
						"/dev/disk/by-id/nvme-device-1",
					},
					oldConditions:   []metav1.Condition{},
					expectError:     true,
					errorSubstrings: []string{"spec.devices[1]", "duplicate"},
				},
			),

			// Reject blank/empty devices on update
			Entry("reject update when devices list becomes empty",
				updateTestCase{
					description:     "should reject update when devices list becomes empty",
					oldDevices:      []string{"/dev/disk/by-id/nvme-device-0"},
					newDevices:      []string{},
					oldConditions:   []metav1.Condition{},
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be empty"},
				},
			),
			Entry("reject update when device becomes blank",
				updateTestCase{
					description:     "should reject update when device becomes blank",
					oldDevices:      []string{"/dev/disk/by-id/nvme-device-0"},
					newDevices:      []string{""},
					oldConditions:   []metav1.Condition{},
					expectError:     true,
					errorSubstrings: []string{"spec.devices[0] cannot be blank/empty"},
				},
			),
			Entry("reject update when one of multiple devices becomes blank",
				updateTestCase{
					description:     "should reject update when one of multiple devices becomes blank",
					oldDevices:      []string{"/dev/disk/by-id/nvme-device-0", "/dev/disk/by-id/nvme-device-1"},
					newDevices:      []string{"/dev/disk/by-id/nvme-device-0", ""},
					oldConditions:   []metav1.Condition{},
					expectError:     true,
					errorSubstrings: []string{"spec.devices[1] cannot be blank/empty"},
				},
			),
			Entry("reject update when devices list contains whitespace-only entries",
				updateTestCase{
					description:     "should reject update when devices list contains whitespace-only entries",
					oldDevices:      []string{"/dev/disk/by-id/nvme-device-0"},
					newDevices:      []string{" ", "\t", " \t "},
					oldConditions:   []metav1.Condition{},
					expectError:     true,
					errorSubstrings: []string{"spec.devices[0] cannot be blank/empty"},
				},
			),

			// Block updates when LocalDiskCreated=True
			Entry("reject device value change when LocalDiskCreated=True",
				updateTestCase{
					description: "should reject device value change when LocalDiskCreated=True",
					oldDevices:  []string{"/dev/disk/by-id/nvme-device-0"},
					newDevices:  []string{"/dev/disk/by-id/nvme-device-999"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be modified", "LocalDisks were created"},
				},
			),
			Entry("reject device order change when LocalDiskCreated=True",
				updateTestCase{
					description: "should reject device order change when LocalDiskCreated=True",
					oldDevices:  []string{"/dev/disk/by-id/nvme-device-0", "/dev/disk/by-id/nvme-device-1"},
					newDevices:  []string{"/dev/disk/by-id/nvme-device-1", "/dev/disk/by-id/nvme-device-0"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be modified"},
				},
			),
			Entry("reject adding device when LocalDiskCreated=True",
				updateTestCase{
					description: "should reject adding device when LocalDiskCreated=True",
					oldDevices:  []string{"/dev/disk/by-id/nvme-device-0"},
					newDevices:  []string{"/dev/disk/by-id/nvme-device-0", "/dev/disk/by-id/nvme-device-1"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be modified"},
				},
			),
			Entry("reject removing device when LocalDiskCreated=True",
				updateTestCase{
					description: "should reject removing device when LocalDiskCreated=True",
					oldDevices:  []string{"/dev/disk/by-id/nvme-device-0", "/dev/disk/by-id/nvme-device-1"},
					newDevices:  []string{"/dev/disk/by-id/nvme-device-0"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be modified"},
				},
			),

			// Edge cases
			Entry("allow update when devices are identical (no change)",
				updateTestCase{
					description: "should allow update when devices are identical (no change)",
					oldDevices:  []string{"/dev/disk/by-id/nvme-device-0", "/dev/disk/by-id/nvme-device-1"},
					newDevices:  []string{"/dev/disk/by-id/nvme-device-0", "/dev/disk/by-id/nvme-device-1"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					expectError: false,
				},
			),
			Entry("handle missing FSC gracefully (allow update)",
				updateTestCase{
					description: "should handle missing FSC gracefully (allow update)",
					oldDevices:  []string{"/dev/disk/by-id/nvme-device-0"},
					newDevices:  []string{"/dev/disk/by-id/nvme-device-1"},
					expectError: false,
				},
			),
		)

		It("should allow update with blank devices during deletion (finalizer removal)", func() {
			now := metav1.Now()
			oldFSC := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:              "test-fsc",
					Namespace:         "ibm-spectrum-scale",
					DeletionTimestamp: &now,
					Finalizers:        []string{"fusion.storage.openshift.io/filesystemclaim-finalizer"},
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{""},
				},
			}

			newFSC := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:              "test-fsc",
					Namespace:         "ibm-spectrum-scale",
					DeletionTimestamp: &now,
					Finalizers:        []string{}, // Finalizer removed
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{""},
				},
			}

			warnings, err := validator.ValidateUpdate(ctx, oldFSC, newFSC)
			Expect(err).NotTo(HaveOccurred(), "should allow finalizer removal during deletion even with blank devices")
			Expect(warnings).To(BeNil())
		})

		It("should reject spec.devices changes during deletion", func() {
			now := metav1.Now()
			oldFSC := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:              "test-fsc",
					Namespace:         "ibm-spectrum-scale",
					DeletionTimestamp: &now,
					Finalizers:        []string{"fusion.storage.openshift.io/filesystemclaim-finalizer"},
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{"/dev/disk/by-id/nvme-device-0"},
				},
			}

			newFSC := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:              "test-fsc",
					Namespace:         "ibm-spectrum-scale",
					DeletionTimestamp: &now,
					Finalizers:        []string{"fusion.storage.openshift.io/filesystemclaim-finalizer"},
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{"/dev/disk/by-id/nvme-device-1"}, // Different device
				},
			}

			warnings, err := validator.ValidateUpdate(ctx, oldFSC, newFSC)
			Expect(err).To(HaveOccurred(), "should reject spec.devices changes during deletion")
			Expect(err.Error()).To(ContainSubstring("spec.devices cannot be modified during deletion"))
			Expect(warnings).To(BeNil())
		})

		It("should reject device IDs with leading whitespace on update", func() {
			oldFSC := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc-whitespace",
					Namespace: "ibm-spectrum-scale",
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{"/dev/disk/by-id/nvme-device-0"},
				},
			}

			newFSC := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc-whitespace",
					Namespace: "ibm-spectrum-scale",
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{
						"  /dev/disk/by-id/nvme-device-0",
					},
				},
			}

			warnings, err := validator.ValidateUpdate(ctx, oldFSC, newFSC)
			Expect(err).To(HaveOccurred(), "should reject device IDs with leading whitespace on update")
			Expect(err.Error()).To(ContainSubstring("spec.devices[0]"))
			Expect(err.Error()).To(ContainSubstring("/dev/disk/by-id/"))
			Expect(warnings).To(BeNil())
		})

		It("should allow update to other fields when LocalDiskCreated=True", func() {
			oldFSC := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: "ibm-spectrum-scale",
					Labels: map[string]string{
						"test": "old",
					},
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{"/dev/disk/by-id/nvme-device-0"},
				},
				Status: FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
				},
			}

			newFSC := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: "ibm-spectrum-scale",
					Labels: map[string]string{
						"test": "new",
					},
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{"/dev/disk/by-id/nvme-device-0"}, // Same devices
				},
			}

			warnings, err := validator.ValidateUpdate(ctx, oldFSC, newFSC)
			Expect(err).NotTo(HaveOccurred())
			Expect(warnings).To(BeNil())
		})
	})

	Describe("ValidateDelete", func() {
		It("should allow deletion", func() {
			fsc := &FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: "ibm-spectrum-scale",
				},
				Spec: FileSystemClaimSpec{
					Devices: []string{"/dev/disk/by-id/nvme-device-0"},
				},
			}

			warnings, err := validator.ValidateDelete(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(warnings).To(BeNil())
		})
	})
})
