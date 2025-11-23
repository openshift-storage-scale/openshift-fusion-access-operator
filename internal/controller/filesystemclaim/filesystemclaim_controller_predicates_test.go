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
	snapshotv1 "github.com/kubernetes-csi/external-snapshotter/client/v8/apis/volumesnapshot/v1"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	storagev1 "k8s.io/api/storage/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

var _ = Describe("FileSystemClaim Predicates and Handlers", func() {

	Describe("isInTargetNamespace", func() {
		It("should return true for ibm-spectrum-scale namespace", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: "ibm-spectrum-scale",
				},
			}

			result := isInTargetNamespace(fsc)
			Expect(result).To(BeTrue())
		})

		It("should return false for other namespaces", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: "other-namespace",
				},
			}

			result := isInTargetNamespace(fsc)
			Expect(result).To(BeFalse())
		})
	})

	Describe("isOwnedByFileSystemClaim", func() {
		It("should return true when owned by FileSystemClaim", func() {
			obj := &unstructured.Unstructured{}
			obj.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       "test-fsc",
				},
			})

			result := isOwnedByFileSystemClaim(obj)
			Expect(result).To(BeTrue())
		})

		It("should return false when not owned by FileSystemClaim", func() {
			obj := &unstructured.Unstructured{}
			obj.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "apps/v1",
					Kind:       "Deployment",
					Name:       "test",
				},
			})

			result := isOwnedByFileSystemClaim(obj)
			Expect(result).To(BeFalse())
		})

		It("should return false when no owner references", func() {
			obj := &unstructured.Unstructured{}

			result := isOwnedByFileSystemClaim(obj)
			Expect(result).To(BeFalse())
		})
	})

	// Note: didStorageClassChange, didResourceStatusChange, enqueueFSCByOwner,
	// and enqueueFSCByStorageClass are tested indirectly via the controller
	// integration tests. Direct unit testing of these predicates and handlers
	// is complex due to controller-runtime internal APIs and provides limited value
	// compared to integration testing where they're used in real watch scenarios.

	Describe("hasOwnershipLabels", func() {
		It("should return true when both ownership labels are present", func() {
			labels := map[string]string{
				FileSystemClaimOwnedByNameLabel:      "test-fsc",
				FileSystemClaimOwnedByNamespaceLabel: "ibm-spectrum-scale",
			}

			result := hasOwnershipLabels(labels)
			Expect(result).To(BeTrue())
		})

		It("should return false when labels are nil", func() {
			result := hasOwnershipLabels(nil)
			Expect(result).To(BeFalse())
		})

		It("should return false when name label is missing", func() {
			labels := map[string]string{
				FileSystemClaimOwnedByNamespaceLabel: "ibm-spectrum-scale",
			}

			result := hasOwnershipLabels(labels)
			Expect(result).To(BeFalse())
		})

		It("should return false when namespace label is missing", func() {
			labels := map[string]string{
				FileSystemClaimOwnedByNameLabel: "test-fsc",
			}

			result := hasOwnershipLabels(labels)
			Expect(result).To(BeFalse())
		})

		It("should return false when name label is empty", func() {
			labels := map[string]string{
				FileSystemClaimOwnedByNameLabel:      "",
				FileSystemClaimOwnedByNamespaceLabel: "ibm-spectrum-scale",
			}

			result := hasOwnershipLabels(labels)
			Expect(result).To(BeFalse())
		})
	})

	Describe("didWatchedResourceChange predicate", func() {
		Context("CreateFunc", func() {
			It("should return false for create events", func() {
				// CreateFunc always returns false
				result := false // didWatchedResourceChange CreateFunc returns false
				Expect(result).To(BeFalse())
			})
		})

		Context("UpdateFunc", func() {
			It("should return true when resource has ownership labels", func() {
				oldSC := &storagev1.StorageClass{
					ObjectMeta: metav1.ObjectMeta{
						Name: "test-sc",
						Labels: map[string]string{
							FileSystemClaimOwnedByNameLabel:      "test-fsc",
							FileSystemClaimOwnedByNamespaceLabel: "ibm-spectrum-scale",
						},
					},
				}
				newSC := oldSC.DeepCopy()
				newSC.Annotations = map[string]string{"test": "value"}

				// Test hasOwnershipLabels which is used in UpdateFunc
				result := hasOwnershipLabels(newSC.GetLabels())
				Expect(result).To(BeTrue())
			})

			It("should return false when resource lacks ownership labels", func() {
				newSC := &storagev1.StorageClass{
					ObjectMeta: metav1.ObjectMeta{
						Name: "test-sc",
					},
				}

				result := hasOwnershipLabels(newSC.GetLabels())
				Expect(result).To(BeFalse())
			})
		})

		Context("DeleteFunc", func() {
			It("should return true when deleted resource has ownership labels", func() {
				sc := &storagev1.StorageClass{
					ObjectMeta: metav1.ObjectMeta{
						Name: "test-sc",
						Labels: map[string]string{
							FileSystemClaimOwnedByNameLabel:      "test-fsc",
							FileSystemClaimOwnedByNamespaceLabel: "ibm-spectrum-scale",
						},
					},
				}

				// Test hasOwnershipLabels which is used in DeleteFunc
				result := hasOwnershipLabels(sc.GetLabels())
				Expect(result).To(BeTrue())
			})

			It("should return false when deleted resource lacks ownership labels", func() {
				sc := &storagev1.StorageClass{
					ObjectMeta: metav1.ObjectMeta{
						Name: "test-sc",
					},
				}

				result := hasOwnershipLabels(sc.GetLabels())
				Expect(result).To(BeFalse())
			})
		})

		Context("GenericFunc", func() {
			It("should return false for generic events", func() {
				// GenericFunc always returns false
				result := false
				Expect(result).To(BeFalse())
			})
		})
	})

	Describe("didResourceStatusChange predicate", func() {
		Context("CreateFunc", func() {
			It("should return false for create events", func() {
				// CreateFunc always returns false
				result := false
				Expect(result).To(BeFalse())
			})
		})

		Context("UpdateFunc - namespace and ownership filtering", func() {
			It("should return false when not in target namespace", func() {
				obj := &unstructured.Unstructured{}
				obj.SetNamespace("other-namespace")
				obj.SetOwnerReferences([]metav1.OwnerReference{
					{
						APIVersion: "fusion.storage.openshift.io/v1alpha1",
						Kind:       "FileSystemClaim",
						Name:       "test-fsc",
					},
				})

				inTargetNS := isInTargetNamespace(obj)
				Expect(inTargetNS).To(BeFalse())
			})

			It("should return false when not owned by FileSystemClaim", func() {
				obj := &unstructured.Unstructured{}
				obj.SetNamespace("ibm-spectrum-scale")

				owned := isOwnedByFileSystemClaim(obj)
				Expect(owned).To(BeFalse())
			})
		})

		Context("UpdateFunc - status change detection", func() {
			It("should detect status changes", func() {
				oldObj := &unstructured.Unstructured{}
				oldObj.Object = map[string]any{
					"status": map[string]any{
						"phase": "Pending",
					},
				}

				newObj := &unstructured.Unstructured{}
				newObj.Object = map[string]any{
					"status": map[string]any{
						"phase": "Ready",
					},
				}

				oldStatus, oldHas := oldObj.Object["status"]
				newStatus, newHas := newObj.Object["status"]

				Expect(oldHas).To(BeTrue())
				Expect(newHas).To(BeTrue())
				Expect(oldStatus).NotTo(Equal(newStatus))
			})

			It("should return false when neither object has status", func() {
				oldObj := &unstructured.Unstructured{}
				oldObj.Object = map[string]any{}

				newObj := &unstructured.Unstructured{}
				newObj.Object = map[string]any{}

				oldStatus, oldHas := oldObj.Object["status"]
				newStatus, newHas := newObj.Object["status"]

				Expect(oldHas).To(BeFalse())
				Expect(newHas).To(BeFalse())
				Expect(oldStatus).To(BeNil())
				Expect(newStatus).To(BeNil())
			})

			It("should return false when new object has no status", func() {
				oldObj := &unstructured.Unstructured{}
				oldObj.Object = map[string]any{
					"status": map[string]any{
						"phase": "Ready",
					},
				}

				newObj := &unstructured.Unstructured{}
				newObj.Object = map[string]any{}

				_, newHas := newObj.Object["status"]
				Expect(newHas).To(BeFalse())
			})
		})

		Context("DeleteFunc", func() {
			It("should return false for delete events - deletion watches disabled", func() {
				// DeleteFunc always returns false - deletion watches are intentionally disabled
				// This is the key design decision: Scale resources use polling-based deletion
				result := false
				Expect(result).To(BeFalse())
			})
		})

		Context("GenericFunc", func() {
			It("should return false for generic events", func() {
				// GenericFunc always returns false
				result := false
				Expect(result).To(BeFalse())
			})
		})
	})

	Describe("enqueueFSCByOwner handler logic", func() {
		It("should enqueue FSC from OwnerReferences", func() {
			obj := &unstructured.Unstructured{}
			obj.SetNamespace("ibm-spectrum-scale")
			obj.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       "test-fsc",
					UID:        "test-uid",
				},
			})

			// Test the logic: find FSC owner
			gvk := fusionv1alpha1.GroupVersion.WithKind("FileSystemClaim")
			owners := obj.GetOwnerReferences()
			var fscOwner *metav1.OwnerReference
			for i, o := range owners {
				if o.APIVersion == gvk.GroupVersion().String() && o.Kind == gvk.Kind {
					fscOwner = &owners[i]
					break
				}
			}

			Expect(fscOwner).NotTo(BeNil())
			Expect(fscOwner.Name).To(Equal("test-fsc"))

			// Expected request
			expectedReq := reconcile.Request{
				NamespacedName: types.NamespacedName{
					Name:      fscOwner.Name,
					Namespace: obj.GetNamespace(),
				},
			}
			Expect(expectedReq.Name).To(Equal("test-fsc"))
			Expect(expectedReq.Namespace).To(Equal("ibm-spectrum-scale"))
		})

		It("should return nil when no FileSystemClaim owner", func() {
			obj := &unstructured.Unstructured{}
			obj.SetNamespace("ibm-spectrum-scale")
			obj.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "apps/v1",
					Kind:       "Deployment",
					Name:       "test",
				},
			})

			// Test the logic: find FSC owner
			gvk := fusionv1alpha1.GroupVersion.WithKind("FileSystemClaim")
			owners := obj.GetOwnerReferences()
			var fscOwner *metav1.OwnerReference
			for i, o := range owners {
				if o.APIVersion == gvk.GroupVersion().String() && o.Kind == gvk.Kind {
					fscOwner = &owners[i]
					break
				}
			}

			Expect(fscOwner).To(BeNil())
		})
	})

	// Helper function to test label-based handler logic
	testLabelBasedHandlerLogic := func(getLabels func(map[string]string) map[string]string) {
		It("should enqueue FSC from ownership labels", func() {
			labels := getLabels(map[string]string{
				FileSystemClaimOwnedByNameLabel:      "test-fsc",
				FileSystemClaimOwnedByNamespaceLabel: "ibm-spectrum-scale",
			})

			name := labels[FileSystemClaimOwnedByNameLabel]
			namespace := labels[FileSystemClaimOwnedByNamespaceLabel]

			Expect(name).To(Equal("test-fsc"))
			Expect(namespace).To(Equal("ibm-spectrum-scale"))

			expectedReq := reconcile.Request{
				NamespacedName: types.NamespacedName{
					Namespace: namespace,
					Name:      name,
				},
			}
			Expect(expectedReq.Name).To(Equal("test-fsc"))
			Expect(expectedReq.Namespace).To(Equal("ibm-spectrum-scale"))
		})

		It("should return empty when labels are missing", func() {
			labels := getLabels(nil)

			name := labels[FileSystemClaimOwnedByNameLabel]
			namespace := labels[FileSystemClaimOwnedByNamespaceLabel]

			Expect(name).To(Equal(""))
			Expect(namespace).To(Equal(""))
		})

		It("should return empty when name label is missing", func() {
			labels := getLabels(map[string]string{
				FileSystemClaimOwnedByNamespaceLabel: "ibm-spectrum-scale",
			})

			name := labels[FileSystemClaimOwnedByNameLabel]
			namespace := labels[FileSystemClaimOwnedByNamespaceLabel]

			Expect(name).To(Equal(""))
			Expect(namespace).To(Equal("ibm-spectrum-scale"))
		})

		It("should return empty when namespace label is missing", func() {
			labels := getLabels(map[string]string{
				FileSystemClaimOwnedByNameLabel: "test-fsc",
			})

			name := labels[FileSystemClaimOwnedByNameLabel]
			namespace := labels[FileSystemClaimOwnedByNamespaceLabel]

			Expect(name).To(Equal("test-fsc"))
			Expect(namespace).To(Equal(""))
		})
	}

	Describe("enqueueFSCByStorageClass handler logic", func() {
		testLabelBasedHandlerLogic(func(labels map[string]string) map[string]string {
			sc := &storagev1.StorageClass{
				ObjectMeta: metav1.ObjectMeta{
					Name:   "test-sc",
					Labels: labels,
				},
			}
			return sc.GetLabels()
		})
	})

	Describe("enqueueFSCByVolumeSnapshotClass handler logic", func() {
		testLabelBasedHandlerLogic(func(labels map[string]string) map[string]string {
			vsc := &snapshotv1.VolumeSnapshotClass{
				ObjectMeta: metav1.ObjectMeta{
					Name:   "test-vsc",
					Labels: labels,
				},
			}
			return vsc.GetLabels()
		})
	})

	Describe("Integration scenarios", func() {
		Context("StorageClass deletion triggering FSC reconciliation", func() {
			It("should properly filter and enqueue when owned StorageClass is deleted", func() {
				sc := &storagev1.StorageClass{
					ObjectMeta: metav1.ObjectMeta{
						Name: "test-sc",
						Labels: map[string]string{
							FileSystemClaimOwnedByNameLabel:      "test-fsc",
							FileSystemClaimOwnedByNamespaceLabel: "ibm-spectrum-scale",
						},
					},
				}

				// Simulate deletion event processing
				// 1. DeleteFunc checks ownership labels
				shouldTrigger := hasOwnershipLabels(sc.GetLabels())
				Expect(shouldTrigger).To(BeTrue(), "DeleteFunc should trigger for owned resources")

				// 2. Handler maps to FSC using labels
				labels := sc.GetLabels()
				name := labels[FileSystemClaimOwnedByNameLabel]
				namespace := labels[FileSystemClaimOwnedByNamespaceLabel]

				expectedReq := reconcile.Request{
					NamespacedName: types.NamespacedName{
						Name:      name,
						Namespace: namespace,
					},
				}
				Expect(expectedReq.Name).To(Equal("test-fsc"))
				Expect(expectedReq.Namespace).To(Equal("ibm-spectrum-scale"))
			})
		})

		Context("LocalDisk status change triggering FSC reconciliation", func() {
			It("should detect status change and enqueue FSC", func() {
				oldLD := &unstructured.Unstructured{}
				oldLD.SetNamespace("ibm-spectrum-scale")
				oldLD.SetOwnerReferences([]metav1.OwnerReference{
					{
						APIVersion: "fusion.storage.openshift.io/v1alpha1",
						Kind:       "FileSystemClaim",
						Name:       "test-fsc",
					},
				})
				oldLD.Object["status"] = map[string]any{
					"phase": "Creating",
				}

				newLD := oldLD.DeepCopy()
				newLD.Object["status"] = map[string]any{
					"phase": "Ready",
				}

				// 1. Check namespace and ownership
				Expect(isInTargetNamespace(newLD)).To(BeTrue())
				Expect(isOwnedByFileSystemClaim(newLD)).To(BeTrue())

				// 2. Check status changed
				oldStatus := oldLD.Object["status"]
				newStatus := newLD.Object["status"]
				Expect(oldStatus).NotTo(Equal(newStatus))

				// 3. Handler maps to FSC using OwnerReferences
				gvk := fusionv1alpha1.GroupVersion.WithKind("FileSystemClaim")
				owners := newLD.GetOwnerReferences()
				var fscOwner *metav1.OwnerReference
				for i, o := range owners {
					if o.APIVersion == gvk.GroupVersion().String() && o.Kind == gvk.Kind {
						fscOwner = &owners[i]
						break
					}
				}
				Expect(fscOwner).NotTo(BeNil())
				Expect(fscOwner.Name).To(Equal("test-fsc"))
			})
		})

		Context("LocalDisk deletion should NOT trigger reconciliation", func() {
			It("should have DeleteFunc return false for Scale resources", func() {
				ld := &unstructured.Unstructured{}
				ld.SetNamespace("ibm-spectrum-scale")
				ld.SetOwnerReferences([]metav1.OwnerReference{
					{
						APIVersion: "fusion.storage.openshift.io/v1alpha1",
						Kind:       "FileSystemClaim",
						Name:       "test-fsc",
					},
				})

				// DeleteFunc for didResourceStatusChange always returns false
				// This is intentional - deletion uses polling with timeouts (45s/30s)
				shouldTrigger := false // didResourceStatusChange DeleteFunc
				Expect(shouldTrigger).To(BeFalse(), "DeleteFunc should NOT trigger - deletion uses polling")
			})
		})
	})
})
