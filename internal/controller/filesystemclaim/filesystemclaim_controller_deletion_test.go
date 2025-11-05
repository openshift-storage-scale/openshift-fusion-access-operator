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
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	storagev1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

var _ = Describe("FileSystemClaim Deletion Flow", func() {
	var (
		ctx       context.Context
		namespace = "test-deletion"
		scheme    *runtime.Scheme
	)

	BeforeEach(func() {
		ctx = context.Background()

		// Create scheme with all required types
		scheme = runtime.NewScheme()
		Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
		Expect(fusionv1alpha1.AddToScheme(scheme)).To(Succeed())
	})

	Describe("markDeletionRequested", func() {
		It("should set Ready=False with ReasonDeletionRequested", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.markDeletionRequested(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonDeletionRequested))
		})

		It("should be idempotent when already set", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeReady,
							Status: metav1.ConditionFalse,
							Reason: ReasonDeletionRequested,
						},
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.markDeletionRequested(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())
		})
	})

	Describe("checkStorageClassUsage", func() {
		It("should not block when no PVs exist", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonStorageClassCreationSucceeded,
						},
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.checkStorageClassUsage(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(requeueAfter).To(Equal(time.Duration(0)))
			Expect(changed).To(BeFalse())
		})

		It("should block when PVs are using the StorageClass", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonStorageClassCreationSucceeded,
						},
					},
				},
			}

			// Create PV using the StorageClass
			pv := &corev1.PersistentVolume{
				ObjectMeta: metav1.ObjectMeta{
					Name: "test-pv",
				},
				Spec: corev1.PersistentVolumeSpec{
					StorageClassName: fsc.Name,
					Capacity: corev1.ResourceList{
						corev1.ResourceStorage: resource.MustParse("1Gi"),
					},
					AccessModes: []corev1.PersistentVolumeAccessMode{
						corev1.ReadWriteOnce,
					},
					PersistentVolumeSource: corev1.PersistentVolumeSource{
						HostPath: &corev1.HostPathVolumeSource{
							Path: "/tmp/test",
						},
					},
				},
				Status: corev1.PersistentVolumeStatus{
					Phase: corev1.VolumeBound,
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, pv).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.checkStorageClassUsage(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(requeueAfter).To(Equal(30 * time.Second)) // Initial backoff
			Expect(changed).To(BeTrue())

			// Verify DeletionBlocked condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeDeletionBlocked)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
			Expect(cond.Reason).To(Equal(ReasonStorageClassInUse))
			Expect(cond.Message).To(ContainSubstring("test-pv"))
		})

		It("should skip check when StorageClass already deleted", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				storageClassCreatedCondition(metav1.ConditionFalse, ReasonStorageClassDeleted),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.checkStorageClassUsage(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(requeueAfter).To(Equal(time.Duration(0)))
			Expect(changed).To(BeFalse())
		})
	})

	Describe("checkFilesystemDeletionLabel", func() {
		It("should block when deletion label is missing", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonFileSystemCreationSucceeded,
						},
					},
				},
			}

			// Create Filesystem without deletion label
			fs := &unstructured.Unstructured{}
			fs.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs.SetName(fsc.Name)
			fs.SetNamespace(fsc.Namespace)
			fs.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, fs).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.checkFilesystemDeletionLabel(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(requeueAfter).To(Equal(30 * time.Second))
			Expect(changed).To(BeTrue())

			// Verify condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeDeletionBlocked)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
			Expect(cond.Reason).To(Equal(ReasonFileSystemLabelNotPresent))
		})

		It("should not block when deletion label is present", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonFileSystemCreationSucceeded,
						},
					},
				},
			}

			// Create Filesystem WITH deletion label
			fs := &unstructured.Unstructured{}
			fs.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs.SetName(fsc.Name)
			fs.SetNamespace(fsc.Namespace)
			fs.SetLabels(map[string]string{
				FileSystemDeletionLabel: "true",
			})
			fs.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, fs).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.checkFilesystemDeletionLabel(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(requeueAfter).To(Equal(time.Duration(0)))
			Expect(changed).To(BeFalse())
		})

		It("should skip check when Filesystem already deleted", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				filesystemCreatedCondition(metav1.ConditionFalse, ReasonFilesystemDeleted),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.checkFilesystemDeletionLabel(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(requeueAfter).To(Equal(time.Duration(0)))
			Expect(changed).To(BeFalse())
		})

		It("should return error when multiple Filesystems exist", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonFileSystemCreationSucceeded,
						},
					},
				},
			}

			// Create 2 Filesystems (error case)
			fs1 := &unstructured.Unstructured{}
			fs1.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs1.SetName("test-fs-1")
			fs1.SetNamespace(fsc.Namespace)
			fs1.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			fs2 := &unstructured.Unstructured{}
			fs2.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs2.SetName("test-fs-2")
			fs2.SetNamespace(fsc.Namespace)
			fs2.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, fs1, fs2).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.checkFilesystemDeletionLabel(ctx, fsc)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("multiple Filesystems found"))
			Expect(requeueAfter).To(Equal(time.Duration(0)))
			Expect(changed).To(BeFalse())
		})
	})

	Describe("deleteStorageClass", func() {
		It("should delete StorageClass when it exists", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonStorageClassCreationSucceeded,
						},
					},
				},
			}

			sc := &storagev1.StorageClass{
				ObjectMeta: metav1.ObjectMeta{
					Name: fsc.Name,
				},
				Provisioner: "test-provisioner",
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, sc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.deleteStorageClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify SC is deleted (or being deleted)
			deleted := &storagev1.StorageClass{}
			err = fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name}, deleted)
			Expect(err).To(HaveOccurred()) // Should be gone
		})

		It("should mark StorageClassCreated=False when SC already gone", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonStorageClassCreationSucceeded,
						},
					},
				},
			}

			// No SC created - already gone
			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.deleteStorageClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeStorageClassCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonStorageClassDeleted))
		})

		It("should skip when StorageClassCreated already False", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				storageClassCreatedCondition(metav1.ConditionFalse, ReasonStorageClassDeleted),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.deleteStorageClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())
		})
	})

	// Helper for testing "mark resource as deleted when already gone" pattern
	testMarkAsDeleted := func(condType, createdReason, deletedReason string, deleteFunc func(*FileSystemClaimReconciler, context.Context, *fusionv1alpha1.FileSystemClaim) (time.Duration, bool, error)) {
		fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
			{Type: condType, Status: metav1.ConditionTrue, Reason: createdReason},
		})

		fakeClient := fake.NewClientBuilder().
			WithScheme(scheme).
			WithObjects(fsc).
			WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
			Build()

		reconciler := &FileSystemClaimReconciler{Client: fakeClient, Scheme: scheme}

		requeueAfter, changed, err := deleteFunc(reconciler, ctx, fsc)
		Expect(err).NotTo(HaveOccurred())
		Expect(changed).To(BeTrue())
		Expect(requeueAfter).To(Equal(time.Duration(0)))

		updated := &fusionv1alpha1.FileSystemClaim{}
		Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

		cond := findCondition(updated.Status.Conditions, condType)
		Expect(cond).NotTo(BeNil())
		Expect(cond.Status).To(Equal(metav1.ConditionFalse))
		Expect(cond.Reason).To(Equal(deletedReason))
	}

	Describe("deleteFilesystem", func() {
		It("should delete Filesystem when it exists", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonFileSystemCreationSucceeded,
						},
					},
				},
			}

			fs := &unstructured.Unstructured{}
			fs.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs.SetName(fsc.Name)
			fs.SetNamespace(fsc.Namespace)
			fs.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, fs).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.deleteFilesystem(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())
			Expect(requeueAfter).To(Equal(45 * time.Second))
		})

		It("should mark FileSystemCreated=False when FS already gone", func() {
			testMarkAsDeleted(
				fusionv1alpha1.ConditionTypeFileSystemCreated,
				ReasonFileSystemCreationSucceeded,
				ReasonFilesystemDeleted,
				func(r *FileSystemClaimReconciler, ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (time.Duration, bool, error) {
					return r.deleteFilesystem(ctx, fsc)
				},
			)
		})
	})

	Describe("deleteLocalDisks", func() {
		It("should delete all LocalDisks when they exist", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeLocalDiskCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonLocalDiskCreationSucceeded,
						},
					},
				},
			}

			// Create 2 LocalDisks
			ld1 := &unstructured.Unstructured{}
			ld1.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskKind,
			})
			ld1.SetName("test-ld-1")
			ld1.SetNamespace(fsc.Namespace)
			ld1.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			ld2 := &unstructured.Unstructured{}
			ld2.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskKind,
			})
			ld2.SetName("test-ld-2")
			ld2.SetNamespace(fsc.Namespace)
			ld2.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, ld1, ld2).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.deleteLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())
			Expect(requeueAfter).To(Equal(30 * time.Second))
		})

		It("should mark LocalDiskCreated=False when LDs already gone", func() {
			testMarkAsDeleted(
				fusionv1alpha1.ConditionTypeLocalDiskCreated,
				ReasonLocalDiskCreationSucceeded,
				ReasonLocalDiskDeleted,
				func(r *FileSystemClaimReconciler, ctx context.Context, fsc *fusionv1alpha1.FileSystemClaim) (time.Duration, bool, error) {
					return r.deleteLocalDisks(ctx, fsc)
				},
			)
		})
	})

	Describe("removeFinalizer", func() {
		It("should remove the finalizer successfully", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:       "test-fsc",
					Namespace:  namespace,
					Finalizers: []string{FileSystemClaimFinalizer},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.removeFinalizer(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify finalizer removed
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())
			Expect(updated.Finalizers).NotTo(ContainElement(FileSystemClaimFinalizer))
		})
	})

	Describe("handleDeletion - End-to-End", func() {
		It("should complete full deletion flow with no blockers", func() {
			now := metav1.Now()
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:              "test-fsc",
					Namespace:         namespace,
					DeletionTimestamp: &now,
					Finalizers:        []string{FileSystemClaimFinalizer},
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1"},
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeLocalDiskCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonLocalDiskCreationSucceeded,
						},
						{
							Type:   fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonFileSystemCreationSucceeded,
						},
						{
							Type:   fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonStorageClassCreationSucceeded,
						},
					},
				},
			}

			// Create Filesystem with deletion label
			fs := &unstructured.Unstructured{}
			fs.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs.SetName(fsc.Name)
			fs.SetNamespace(fsc.Namespace)
			fs.SetLabels(map[string]string{
				FileSystemDeletionLabel: "true",
			})
			fs.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, fs).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// First call: Mark deletion requested
			requeueAfter, changed, err := reconciler.handleDeletion(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())
			Expect(requeueAfter).To(Equal(time.Duration(0)))

			// Verify Ready=False
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, fsc)).To(Succeed())
			cond := findCondition(fsc.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Reason).To(Equal(ReasonDeletionRequested))
		})

		It("should block when PV is using StorageClass", func() {
			now := metav1.Now()
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:              "test-fsc",
					Namespace:         namespace,
					DeletionTimestamp: &now,
					Finalizers:        []string{FileSystemClaimFinalizer},
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeReady,
							Status: metav1.ConditionFalse,
							Reason: ReasonDeletionRequested,
						},
						{
							Type:   fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status: metav1.ConditionTrue,
							Reason: ReasonStorageClassCreationSucceeded,
						},
					},
				},
			}

			// Create PV
			pv := &corev1.PersistentVolume{
				ObjectMeta: metav1.ObjectMeta{
					Name: "blocking-pv",
				},
				Spec: corev1.PersistentVolumeSpec{
					StorageClassName: fsc.Name,
					Capacity: corev1.ResourceList{
						corev1.ResourceStorage: resource.MustParse("1Gi"),
					},
					AccessModes: []corev1.PersistentVolumeAccessMode{
						corev1.ReadWriteOnce,
					},
					PersistentVolumeSource: corev1.PersistentVolumeSource{
						HostPath: &corev1.HostPathVolumeSource{
							Path: "/tmp/test",
						},
					},
				},
				Status: corev1.PersistentVolumeStatus{
					Phase: corev1.VolumeBound,
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, pv).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			requeueAfter, changed, err := reconciler.handleDeletion(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())
			Expect(requeueAfter).To(Equal(30 * time.Second)) // Blocked with backoff

			// Verify DeletionBlocked
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, fsc)).To(Succeed())
			cond := findCondition(fsc.Status.Conditions, fusionv1alpha1.ConditionTypeDeletionBlocked)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
			Expect(cond.Reason).To(Equal(ReasonStorageClassInUse))
		})
	})

	Describe("handleFinalizers", func() {
		It("should add finalizer when not present", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{})
			// No finalizer initially

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.handleFinalizers(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify finalizer added
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())
			Expect(updated.Finalizers).To(ContainElement(FileSystemClaimFinalizer))
		})

		It("should skip when finalizer already present", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{})
			fsc.Finalizers = []string{FileSystemClaimFinalizer}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.handleFinalizers(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse()) // No change
		})

		It("should skip when FSC is being deleted", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// Set deletionTimestamp on the fetched object
			now := metav1.Now()
			fsc.DeletionTimestamp = &now

			changed, err := reconciler.handleFinalizers(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse()) // Skip during deletion
		})
	})
})
