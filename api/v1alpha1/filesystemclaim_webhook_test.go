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
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

var _ = Describe("FileSystemClaim Webhook", func() {
	var (
		validator  *FileSystemClaimValidator
		ctx        context.Context
		fakeClient client.Client
	)

	BeforeEach(func() {
		ctx = context.Background()
		// Create a fake client with the scheme
		scheme := runtime.NewScheme()
		Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
		Expect(AddToScheme(scheme)).To(Succeed())
		fakeClient = fake.NewClientBuilder().WithScheme(scheme).Build()
		validator = &FileSystemClaimValidator{Client: fakeClient}
	})

	Describe("ValidateCreate", func() {
		DescribeTable("should allow creation regardless of device validity",
			func(devices []string, description string) {
				fsc := &FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: "ibm-spectrum-scale",
					},
					Spec: FileSystemClaimSpec{
						Devices: devices,
					},
				}

				warnings, err := validator.ValidateCreate(ctx, fsc)
				Expect(err).NotTo(HaveOccurred(), description)
				Expect(warnings).To(BeNil())
			},
			Entry("valid devices", []string{"/dev/nvme1n1", "/dev/nvme2n2"}, "validation happens in controller"),
			Entry("invalid devices", []string{"/dev/nvme1n100"}, "validation happens in controller"),
			Entry("empty devices", []string{}, "validation happens in controller"),
		)
	})

	Describe("ValidateUpdate", func() {
		type updateTestCase struct {
			description     string
			oldDevices      []string
			newDevices      []string
			oldConditions   []metav1.Condition
			setupClient     bool // whether to create the FSC in fake client
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

				if tc.setupClient {
					Expect(fakeClient.Create(ctx, oldFSC)).To(Succeed())
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
					oldDevices:    []string{"/dev/nvme1n100"},
					newDevices:    []string{"/dev/nvme1n1"},
					oldConditions: []metav1.Condition{},
					setupClient:   true,
					expectError:   false,
				},
			),
			Entry("allow update when DeviceValidated=False",
				updateTestCase{
					description: "should allow device update when DeviceValidated=False",
					oldDevices:  []string{"/dev/nvme1n100"},
					newDevices:  []string{"/dev/nvme1n1"},
					oldConditions: []metav1.Condition{
						{
							Type:   "DeviceValidated",
							Status: metav1.ConditionFalse,
							Reason: "DeviceValidationFailed",
						},
					},
					setupClient: true,
					expectError: false,
				},
			),
			Entry("allow update when LocalDiskCreated=False",
				updateTestCase{
					description: "should allow device update when LocalDiskCreated=False",
					oldDevices:  []string{"/dev/nvme1n1", "/dev/nvme2n200"},
					newDevices:  []string{"/dev/nvme1n1", "/dev/nvme2n2"},
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
					setupClient: true,
					expectError: false,
				},
			),

			// Block updates when LocalDiskCreated=True
			Entry("reject device value change when LocalDiskCreated=True",
				updateTestCase{
					description: "should reject device value change when LocalDiskCreated=True",
					oldDevices:  []string{"/dev/nvme1n1"},
					newDevices:  []string{"/dev/nvme500n500"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					setupClient:     true,
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be modified", "LocalDisks were created"},
				},
			),
			Entry("reject device order change when LocalDiskCreated=True",
				updateTestCase{
					description: "should reject device order change when LocalDiskCreated=True",
					oldDevices:  []string{"/dev/nvme1n1", "/dev/nvme2n2"},
					newDevices:  []string{"/dev/nvme2n2", "/dev/nvme1n1"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					setupClient:     true,
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be modified"},
				},
			),
			Entry("reject adding device when LocalDiskCreated=True",
				updateTestCase{
					description: "should reject adding device when LocalDiskCreated=True",
					oldDevices:  []string{"/dev/nvme1n1"},
					newDevices:  []string{"/dev/nvme1n1", "/dev/nvme2n2"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					setupClient:     true,
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be modified"},
				},
			),
			Entry("reject removing device when LocalDiskCreated=True",
				updateTestCase{
					description: "should reject removing device when LocalDiskCreated=True",
					oldDevices:  []string{"/dev/nvme1n1", "/dev/nvme2n2"},
					newDevices:  []string{"/dev/nvme1n1"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					setupClient:     true,
					expectError:     true,
					errorSubstrings: []string{"spec.devices cannot be modified"},
				},
			),

			// Edge cases
			Entry("allow update when devices are identical (no change)",
				updateTestCase{
					description: "should allow update when devices are identical (no change)",
					oldDevices:  []string{"/dev/nvme1n1", "/dev/nvme2n2"},
					newDevices:  []string{"/dev/nvme1n1", "/dev/nvme2n2"},
					oldConditions: []metav1.Condition{
						{
							Type:               "LocalDiskCreated",
							Status:             metav1.ConditionTrue,
							Reason:             "LocalDiskCreationSucceeded",
							LastTransitionTime: metav1.Now(),
						},
					},
					setupClient: true,
					expectError: false,
				},
			),
			Entry("handle missing FSC gracefully (allow update)",
				updateTestCase{
					description: "should handle missing FSC gracefully (allow update)",
					oldDevices:  []string{"/dev/nvme1n1"},
					newDevices:  []string{"/dev/nvme2n2"},
					setupClient: false, // Don't create in client
					expectError: false,
				},
			),
		)

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
					Devices: []string{"/dev/nvme1n1"},
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
					Devices: []string{"/dev/nvme1n1"}, // Same devices
				},
			}

			// Create the FSC with LocalDiskCreated=True
			Expect(fakeClient.Create(ctx, oldFSC)).To(Succeed())

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
					Devices: []string{"/dev/nvme1n1"},
				},
			}

			warnings, err := validator.ValidateDelete(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(warnings).To(BeNil())
		})
	})
})
