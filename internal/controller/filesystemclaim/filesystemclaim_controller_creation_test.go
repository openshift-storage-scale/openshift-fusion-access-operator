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
	"fmt"

	snapshotv1 "github.com/kubernetes-csi/external-snapshotter/client/v8/apis/volumesnapshot/v1"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	storagev1 "k8s.io/api/storage/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

var _ = Describe("FileSystemClaim Creation Flow", func() {
	var (
		ctx       context.Context
		namespace = "test-creation"
		scheme    *runtime.Scheme
	)

	BeforeEach(func() {
		ctx = context.Background()

		// Create scheme with all required types
		scheme = runtime.NewScheme()
		Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
		Expect(fusionv1alpha1.AddToScheme(scheme)).To(Succeed())
		Expect(snapshotv1.AddToScheme(scheme)).To(Succeed())
	})

	Describe("ensureStorageClass", func() {
		It("should create StorageClass when FileSystem is ready", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
					UID:       "test-fsc-uid",
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

			// No need to create actual Filesystem - controller now trusts the condition
			// The condition is only set to True after syncFilesystemConditions validates the actual resource exists

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureStorageClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify SC was created
			sc := &storagev1.StorageClass{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name}, sc)).To(Succeed())
			Expect(sc.Provisioner).To(Equal("spectrumscale.csi.ibm.com"))
			Expect(sc.Parameters["volBackendFs"]).To(Equal(fsc.Name))
			Expect(sc.Annotations[StorageClassDefaultAnnotation]).To(Equal("true"))

			// Verify condition was set
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeStorageClassCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
			Expect(cond.Reason).To(Equal(ReasonStorageClassCreationSucceeded))
		})

		It("should skip when FileSystem not ready", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status: metav1.ConditionFalse,
							Reason: ReasonFileSystemCreationInProgress,
						},
					},
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

			changed, err := reconciler.ensureStorageClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())

			// Verify no SC was created
			sc := &storagev1.StorageClass{}
			err = fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name}, sc)
			Expect(err).To(HaveOccurred()) // Should not exist
		})

		It("should be idempotent when SC already exists with correct spec", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
					UID:       "test-fsc-uid",
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

			// Create actual Filesystem resource (controller now checks resource existence, not just conditions)
			fs := &unstructured.Unstructured{}
			fs.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs.SetName("test-fsc")
			fs.SetNamespace(namespace)
			// Set ownership to ensure listOwnedResources finds it
			fs.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       "test-fsc",
					UID:        "test-fsc-uid",
				},
			})

			// SC already exists with correct spec
			sc := buildStorageClass(fsc, fsc.Name, fsc.Name)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, fs, sc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureStorageClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			// Should still mark condition if not already marked
			Expect(changed).To(BeTrue())

			// Verify condition is set
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeStorageClassCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
		})

		It("should skip StorageClass creation when Filesystem is not owned by this FSC", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
					UID:       "fsc-uid-123",
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status: metav1.ConditionFalse, // Condition is False because we don't own a Filesystem
							Reason: ReasonFileSystemCreationInProgress,
						},
					},
				},
			}

			// No need to create the Filesystem object here - the condition-based approach means
			// if FileSystemCreated=False, ensureStorageClass will skip regardless of what's in the cluster
			// The test validates the behavior: when condition is not True, creation is skipped

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// ensureStorageClass should skip because FileSystemCreated condition is not True
			changed, err := reconciler.ensureStorageClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse(), "should not make changes when FileSystemCreated condition is False")

			// Verify StorageClass was NOT created
			sc := &storagev1.StorageClass{}
			err = fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name}, sc)
			Expect(errors.IsNotFound(err)).To(BeTrue(), "StorageClass should not be created when condition is False")
		})
	})

	// VolumeSnapshotClass tests: Creation and
	Describe("ensureVolumeSnapshotClass", func() {
		It("should create VolumeSnapshotClass when StorageClass is ready", func() {
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

			// No need to create actual StorageClass - controller now trusts the condition
			// The condition is only set to True after ensureStorageClass validates the actual resource exists

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureVolumeSnapshotClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify VSC was created
			vsc := &unstructured.Unstructured{}
			vsc.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   VolumeSnapshotClassGroup,
				Version: VolumeSnapshotClassVersion,
				Kind:    VolumeSnapshotClassKind,
			})
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name}, vsc)).To(Succeed())

			// Verify driver
			driver, found, err := unstructured.NestedString(vsc.Object, "driver")
			Expect(err).NotTo(HaveOccurred())
			Expect(found).To(BeTrue())
			Expect(driver).To(Equal("spectrumscale.csi.ibm.com"))

			// Verify deletionPolicy
			policy, found, err := unstructured.NestedString(vsc.Object, "deletionPolicy")
			Expect(err).NotTo(HaveOccurred())
			Expect(found).To(BeTrue())
			Expect(policy).To(Equal("Delete"))

			// Verify labels
			Expect(vsc.GetLabels()[FileSystemClaimOwnedByNameLabel]).To(Equal(fsc.Name))
			Expect(vsc.GetLabels()[FileSystemClaimOwnedByNamespaceLabel]).To(Equal(fsc.Namespace))

			// Verify condition was set
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeVolumeSnapshotClassCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
			Expect(cond.Reason).To(Equal(ReasonVolumeSnapshotClassCreationSucceeded))
		})

		It("should skip when StorageClass not ready", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status: metav1.ConditionFalse,
							Reason: ReasonStorageClassCreationInProgress,
						},
					},
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

			changed, err := reconciler.ensureVolumeSnapshotClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())

			// Verify no VSC was created
			vsc := &unstructured.Unstructured{}
			vsc.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   VolumeSnapshotClassGroup,
				Version: VolumeSnapshotClassVersion,
				Kind:    VolumeSnapshotClassKind,
			})
			err = fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name}, vsc)
			Expect(err).To(HaveOccurred()) // Should not exist
		})

		It("should be idempotent when VSC already exists with correct spec", func() {
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

			// Create actual StorageClass resource (controller now checks resource existence, not just conditions)
			sc := buildStorageClass(fsc, fsc.Name, fsc.Name)

			// VSC already exists with correct spec
			vsc := buildVolumeSnapshotClass(ctx, fsc, fsc.Name)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, sc, vsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureVolumeSnapshotClass(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			// Should still mark condition if not already marked
			Expect(changed).To(BeTrue())

			// Verify condition is set
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeVolumeSnapshotClassCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
		})
	})

	Describe("syncFSCReady", func() {
		It("should set Ready=True when all components ready", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
					UID:       "test-fsc-uid",
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:               fusionv1alpha1.ConditionTypeDeviceValidated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonDeviceValidationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeLocalDiskCreated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonLocalDiskCreationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonFileSystemCreationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonStorageClassCreationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeVolumeSnapshotClassCreated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonVolumeSnapshotClassCreationSucceeded,
							ObservedGeneration: 1,
						},
					},
				},
			}

			// Create actual resources (controller now checks resource existence, not just conditions)
			// LocalDisk
			ld := &unstructured.Unstructured{}
			ld.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskKind,
			})
			ld.SetName("test-ld")
			ld.SetNamespace(namespace)
			ld.SetLabels(map[string]string{
				FileSystemClaimOwnedByNameLabel:      fsc.Name,
				FileSystemClaimOwnedByNamespaceLabel: fsc.Namespace,
			})
			ld.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			// Filesystem
			fs := &unstructured.Unstructured{}
			fs.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs.SetName("test-fsc")
			fs.SetNamespace(namespace)
			// Set ownership to ensure listOwnedResources finds it
			fs.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       "test-fsc",
					UID:        "test-fsc-uid",
				},
			})

			// StorageClass
			sc := buildStorageClass(fsc, fsc.Name, fsc.Name)

			// VolumeSnapshotClass
			vsc := buildVolumeSnapshotClass(ctx, fsc, fsc.Name)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, ld, fs, sc, vsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncFSCReady(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify Ready=True
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
			Expect(cond.Reason).To(Equal(ReasonProvisioningSucceeded))
		})

		It("should set Ready=False when components not ready", func() {
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
						{
							Type:   fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status: metav1.ConditionFalse, // Not ready
							Reason: ReasonFileSystemCreationInProgress,
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

			changed, err := reconciler.syncFSCReady(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify Ready=False
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonProvisioningInProgress))
		})

		It("should be idempotent when Ready already set correctly", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
					UID:       "test-fsc-uid",
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:               fusionv1alpha1.ConditionTypeDeviceValidated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonDeviceValidationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeLocalDiskCreated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonLocalDiskCreationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeFileSystemCreated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonFileSystemCreationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeStorageClassCreated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonStorageClassCreationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeVolumeSnapshotClassCreated,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonVolumeSnapshotClassCreationSucceeded,
							ObservedGeneration: 1,
						},
						{
							Type:               fusionv1alpha1.ConditionTypeReady,
							Status:             metav1.ConditionTrue,
							Reason:             ReasonProvisioningSucceeded,
							Message:            "All resources created and ready",
							ObservedGeneration: 1,
						},
					},
				},
			}

			// Create actual resources (controller now checks resource existence, not just conditions)
			// LocalDisk
			ld := &unstructured.Unstructured{}
			ld.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskKind,
			})
			ld.SetName("test-ld")
			ld.SetNamespace(namespace)
			ld.SetLabels(map[string]string{
				FileSystemClaimOwnedByNameLabel:      fsc.Name,
				FileSystemClaimOwnedByNamespaceLabel: fsc.Namespace,
			})
			ld.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			// Filesystem
			fs := &unstructured.Unstructured{}
			fs.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemKind,
			})
			fs.SetName("test-fsc")
			fs.SetNamespace(namespace)
			// Set ownership to ensure listOwnedResources finds it
			fs.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       "test-fsc",
					UID:        "test-fsc-uid",
				},
			})

			// StorageClass
			sc := buildStorageClass(fsc, fsc.Name, fsc.Name)

			// VolumeSnapshotClass
			vsc := buildVolumeSnapshotClass(ctx, fsc, fsc.Name)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, ld, fs, sc, vsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncFSCReady(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse()) // No change
		})
	})

	Describe("syncLocalDiskConditions", func() {
		It("should set LocalDiskCreated=False when no LDs exist yet", func() {
			fsc := createTestFSC("test-fsc-sync-ld", namespace, nil, []metav1.Condition{
				deviceValidatedCondition(metav1.ConditionTrue),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncLocalDiskConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeLocalDiskCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonLocalDiskCreationInProgress))
		})

		It("should skip when DeviceValidated is not True", func() {
			fsc := createTestFSC("test-fsc", namespace, []string{"/dev/nvme0n1"}, []metav1.Condition{
				deviceValidatedCondition(metav1.ConditionFalse),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncLocalDiskConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())
		})

		It("should set LocalDiskCreated=True when all LDs are Ready", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeDeviceValidated,
							Status: metav1.ConditionTrue,
							Reason: ReasonDeviceValidationSucceeded,
						},
					},
				},
			}

			// Create LocalDisk with Ready=True
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

			// Set status with Ready=True and Used=False (or True with correct filesystem)
			ld1.Object["status"] = map[string]any{
				"conditions": []any{
					map[string]any{
						"type":   "Ready",
						"status": "True",
						"reason": "Ready",
					},
					map[string]any{
						"type":   "Used",
						"status": "False",
						"reason": "NotUsed",
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, ld1).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncLocalDiskConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeLocalDiskCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
			Expect(cond.Reason).To(Equal(ReasonLocalDiskCreationSucceeded))
		})

		It("should set LocalDiskCreated=False with Failed reason on hard failure", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeDeviceValidated,
							Status: metav1.ConditionTrue,
							Reason: ReasonDeviceValidationSucceeded,
						},
					},
				},
			}

			// Create LocalDisk with Used=True but by different filesystem (hard failure)
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

			// Set status with Used=True by different filesystem
			ld1.Object["status"] = map[string]any{
				"conditions": []any{
					map[string]any{
						"type":   "Ready",
						"status": "True",
						"reason": "Ready",
					},
					map[string]any{
						"type":   "Used",
						"status": "True",
						"reason": "InUse",
					},
				},
				"filesystem": "different-filesystem", // Used by different FS
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, ld1).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncLocalDiskConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify hard failure condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeLocalDiskCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonLocalDiskCreationFailed)) // Hard failure
		})

		It("should return false when condition unchanged", func() {
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeDeviceValidated,
							Status: metav1.ConditionTrue,
							Reason: ReasonDeviceValidationSucceeded,
						},
						{
							Type:    fusionv1alpha1.ConditionTypeLocalDiskCreated,
							Status:  metav1.ConditionTrue,
							Reason:  ReasonLocalDiskCreationSucceeded,
							Message: "All 1 LocalDisks are Ready; if used, they are used by this Filesystem.",
						},
					},
				},
			}

			// Create LocalDisk with Ready=True and Used=False
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

			ld1.Object["status"] = map[string]any{
				"conditions": []any{
					map[string]any{
						"type":   "Ready",
						"status": "True",
						"reason": "Ready",
					},
					map[string]any{
						"type":   "Used",
						"status": "False",
						"reason": "NotUsed",
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, ld1).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncLocalDiskConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse()) // No change - condition already correct
		})
	})

	Describe("syncFilesystemConditions", func() {
		It("should skip when LocalDiskCreated is not True", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				localDiskCreatedCondition(metav1.ConditionFalse, ReasonLocalDiskCreationInProgress),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncFilesystemConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())
		})

		It("should set FileSystemCreated=False when no FS exists", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				localDiskCreatedCondition(metav1.ConditionTrue, ReasonLocalDiskCreationSucceeded),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncFilesystemConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeFileSystemCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonFileSystemCreationInProgress))
		})

		It("should set FileSystemCreated=True when FS is Success and Healthy", func() {
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

			// Create Filesystem with Success=True and Healthy=True
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

			// Set status with Success=True and Healthy=True
			fs.Object["status"] = map[string]any{
				"conditions": []any{
					map[string]any{
						"type":   "Success",
						"status": "True",
						"reason": "Created",
					},
					map[string]any{
						"type":   "Healthy",
						"status": "True",
						"reason": "Healthy",
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, fs).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncFilesystemConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeFileSystemCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionTrue))
			Expect(cond.Reason).To(Equal(ReasonFileSystemCreationSucceeded))
		})

		It("should set FileSystemCreated=False when FS is not healthy", func() {
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

			// Create Filesystem with Success=False
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

			// Set status with Success=False
			fs.Object["status"] = map[string]any{
				"conditions": []any{
					map[string]any{
						"type":   "Success",
						"status": "False",
						"reason": "Creating",
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, fs).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.syncFilesystemConditions(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeFileSystemCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonFileSystemCreationInProgress))
		})
	})

	Describe("ensureLocalDisks", func() {
		It("should skip when LocalDiskCreated is already True", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				localDiskCreatedCondition(metav1.ConditionTrue, ReasonLocalDiskCreationSucceeded),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())
		})

		It("should skip when creation already in progress", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				localDiskCreatedCondition(metav1.ConditionFalse, ReasonLocalDiskCreationInProgress),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())
		})

		It("should validate devices and create LocalDisk atomically", func() {
			// UPDATED TEST: With the TOCTOU race condition fix, validation and creation
			// happen atomically in the same reconcile loop. We no longer persist
			// DeviceValidated=True as a separate step.

			// Set operator namespace for LVDR lookup
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1"},
				},
			}

			// Create storage node and LVDR using helpers
			node := createStorageNode("storage-node-1")
			lvdr := createLVDR("storage-node-1", operatorNS, []fusionv1alpha1.DiscoveredDevice{
				{
					Path: "/dev/nvme0n1",
					WWN:  "uuid.12345678-1234-1234-1234-123456789abc",
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node, lvdr).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify LocalDisk was created (validation happened atomically before creation)
			lds := &unstructured.UnstructuredList{}
			lds.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskList,
			})
			Expect(fakeClient.List(ctx, lds, client.InNamespace(namespace))).To(Succeed())
			Expect(lds.Items).To(HaveLen(1), "Expected one LocalDisk to be created")

			// Verify conditions were set
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			// Verify DeviceValidated=True was set
			deviceValidatedCond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(deviceValidatedCond).NotTo(BeNil(), "DeviceValidated condition should be set")
			Expect(deviceValidatedCond.Status).To(Equal(metav1.ConditionTrue))
			Expect(deviceValidatedCond.Reason).To(Equal(ReasonDeviceValidationSucceeded))

			// Verify LocalDiskCreationInProgress condition was set
			ldCond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeLocalDiskCreated)
			Expect(ldCond).NotTo(BeNil())
			Expect(ldCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(ldCond.Reason).To(Equal(ReasonLocalDiskCreationInProgress))
		})

		It("should prevent TOCTOU race condition when two FSCs claim same device", func() {
			// This test verifies the fix for the Time-of-Check-Time-of-Use (TOCTOU) race condition
			// Scenario: Two FSCs created simultaneously with the same device
			// Expected: Only the first one succeeds, second one fails validation

			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			// Create FSC1 with device /dev/nvme1n1
			fsc1 := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc-1",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme1n1"},
				},
			}

			// Create FSC2 with the SAME device /dev/nvme1n1
			fsc2 := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc-2",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme1n1"},
				},
			}

			// Create storage node and LVDR with the device
			node := createStorageNode("storage-node-1")
			lvdr := createLVDR("storage-node-1", operatorNS, []fusionv1alpha1.DiscoveredDevice{
				{
					Path: "/dev/nvme1n1",
					WWN:  "uuid.aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc1, fsc2, node, lvdr).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}, &fusionv1alpha1.LocalVolumeDiscoveryResult{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// FSC1 reconciles first - should succeed
			changed1, err1 := reconciler.ensureLocalDisks(ctx, fsc1)
			Expect(err1).NotTo(HaveOccurred())
			Expect(changed1).To(BeTrue(), "FSC1 should create LocalDisk")

			// Verify FSC1 created a LocalDisk
			lds := &unstructured.UnstructuredList{}
			lds.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskList,
			})
			Expect(fakeClient.List(ctx, lds, client.InNamespace(namespace))).To(Succeed())
			Expect(lds.Items).To(HaveLen(1), "FSC1 should have created one LocalDisk")

			// Simulate device being removed from LVDR (because it's now claimed)
			// In reality, the LocalVolumeDiscovery controller would update the LVDR
			updatedLVDR := &fusionv1alpha1.LocalVolumeDiscoveryResult{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{
				Name:      fmt.Sprintf("discovery-result-%s", node.Name),
				Namespace: operatorNS,
			}, updatedLVDR)).To(Succeed())

			// Remove the device from LVDR (simulating it being claimed)
			updatedLVDR.Status.DiscoveredDevices = []fusionv1alpha1.DiscoveredDevice{}
			Expect(fakeClient.Status().Update(ctx, updatedLVDR)).To(Succeed())

			// FSC2 reconciles - should fail validation because device is gone
			changed2, err2 := reconciler.ensureLocalDisks(ctx, fsc2)

			// With the fix, FSC2 validates fresh and should detect device is missing
			Expect(err2).NotTo(HaveOccurred(), "Error handling should be graceful")
			Expect(changed2).To(BeTrue(), "Status should be updated with validation error")

			// Verify FSC2 has validation error condition
			updatedFSC2 := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc2.Name, Namespace: fsc2.Namespace}, updatedFSC2)).To(Succeed())

			// Check DeviceValidated condition is set to False
			deviceValidatedCond := findCondition(updatedFSC2.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(deviceValidatedCond).NotTo(BeNil(), "DeviceValidated condition should be set")
			Expect(deviceValidatedCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(deviceValidatedCond.Reason).To(Equal(ReasonDeviceValidationFailed))
			Expect(deviceValidatedCond.Message).To(ContainSubstring("/dev/nvme1n1"))
			// Device disappeared from LVDR, so error is about device not found rather than ownership

			// Check Ready condition
			readyCond := findCondition(updatedFSC2.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(readyCond).NotTo(BeNil())
			Expect(readyCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(readyCond.Reason).To(Equal(ReasonValidationFailed))
			Expect(readyCond.Message).To(ContainSubstring("/dev/nvme1n1"))

			// Verify only ONE LocalDisk was created (by FSC1, not FSC2)
			Expect(fakeClient.List(ctx, lds, client.InNamespace(namespace))).To(Succeed())
			Expect(lds.Items).To(HaveLen(1), "Only FSC1's LocalDisk should exist")
		})

		It("should fail validation when LocalDisk is owned by another FileSystemClaim", func() {
			// This test verifies the ownership check logic when a LocalDisk already exists
			// but is owned by a different FSC. This directly exercises the TOCTOU ownership check.
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			// FSC that already owns the LocalDisk
			fscOwner := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "fsc-owner",
					Namespace: namespace,
					UID:       "fsc-owner-uid",
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme1n1"},
				},
			}

			// FSC under test that is trying to use the same device
			fscUnderTest := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "fsc-under-test",
					Namespace: namespace,
					UID:       "fsc-under-test-uid",
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme1n1"},
				},
			}

			// Create storage node and LVDR with the device
			node := createStorageNode("storage-node-1")
			lvdr := createLVDR("storage-node-1", operatorNS, []fusionv1alpha1.DiscoveredDevice{
				{
					Path: "/dev/nvme1n1",
					WWN:  "uuid.aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				},
			})

			// Pre-create LocalDisk with ownerReference pointing to a different FSC
			localDisk := createLocalDiskWithOwner("uuid.aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", namespace, "/dev/nvme1n1", "storage-node-1", fscOwner)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fscOwner, fscUnderTest, node, lvdr, localDisk).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}, &fusionv1alpha1.LocalVolumeDiscoveryResult{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// Capture initial LocalDisk count
			ldsBefore := &unstructured.UnstructuredList{}
			ldsBefore.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskList,
			})
			Expect(fakeClient.List(ctx, ldsBefore, client.InNamespace(namespace))).To(Succeed())
			initialLDCount := len(ldsBefore.Items)

			changed, err := reconciler.ensureLocalDisks(ctx, fscUnderTest)
			Expect(err).NotTo(HaveOccurred(), "ensureLocalDisks should not return an error when LocalDisk is owned by another FSC")
			Expect(changed).To(BeTrue(), "ensureLocalDisks should report changed when it updates FSC status")

			// Verify no additional LocalDisks were created
			ldsAfter := &unstructured.UnstructuredList{}
			ldsAfter.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskList,
			})
			Expect(fakeClient.List(ctx, ldsAfter, client.InNamespace(namespace))).To(Succeed())
			Expect(ldsAfter.Items).To(HaveLen(initialLDCount), "No additional LocalDisk should be created when ownership conflict occurs")

			// Verify FSC status was updated
			updatedFSC := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fscUnderTest.Name, Namespace: fscUnderTest.Namespace}, updatedFSC)).To(Succeed())

			// DeviceValidated condition should be False with ReasonDeviceValidationFailed
			deviceValidatedCond := findCondition(updatedFSC.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(deviceValidatedCond).NotTo(BeNil(), "DeviceValidated condition must be set")
			Expect(deviceValidatedCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(deviceValidatedCond.Reason).To(Equal(ReasonDeviceValidationFailed))
			Expect(deviceValidatedCond.Message).To(ContainSubstring("already in use"), "message should indicate device is already in use by another FSC")
			Expect(deviceValidatedCond.Message).To(ContainSubstring("fsc-owner"), "message should mention the owner FSC name")
			Expect(deviceValidatedCond.Message).To(ContainSubstring("/dev/nvme1n1"), "message should mention the device path")

			// Ready condition should be False with ReasonValidationFailed
			readyCond := findCondition(updatedFSC.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(readyCond).NotTo(BeNil(), "Ready condition must be set")
			Expect(readyCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(readyCond.Reason).To(Equal(ReasonValidationFailed))
			Expect(readyCond.Message).NotTo(BeEmpty(), "Ready condition should have a message explaining the validation failure")
			Expect(readyCond.Message).To(ContainSubstring("already in use"), "Ready message should indicate device is already in use")
		})

		It("should treat LocalDisk without FSC ownerReferences as ownership conflict", func() {
			// This test verifies the behavior when a LocalDisk exists but has no FSC ownerReferences
			// or only non-FSC ownerReferences. In this case, getOwnerFSCName returns "unknown"
			// and the reconciler should treat it as an ownership conflict.
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			devPath := "/dev/nvme1n1"
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "fsc-with-preexisting-localdisk",
					Namespace: namespace,
					UID:       "fsc-uid",
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{devPath},
				},
			}

			// Create storage node and LVDR with the device
			node := createStorageNode("storage-node-1")
			lvdr := createLVDR("storage-node-1", operatorNS, []fusionv1alpha1.DiscoveredDevice{
				{
					Path: devPath,
					WWN:  "uuid.aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				},
			})

			// Pre-create LocalDisk without FSC ownerReferences (or with non-FSC owner)
			// Use helper function to create LocalDisk with non-FSC owner references
			// This triggers the "unknown" fallback in getOwnerFSCName
			localDisk := createLocalDiskWithoutFSCOwner(
				"uuid.aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				namespace,
				devPath,
				"storage-node-1",
				[]metav1.OwnerReference{
					{
						APIVersion: "v1",
						Kind:       "ConfigMap",
						Name:       "some-non-fsc-owner",
						UID:        types.UID("dummy-uid"),
					},
				},
			)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node, lvdr, localDisk).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}, &fusionv1alpha1.LocalVolumeDiscoveryResult{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// Capture the initial number of LocalDisks and assert it does not increase
			ldsBefore := &unstructured.UnstructuredList{}
			ldsBefore.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskList,
			})
			Expect(fakeClient.List(ctx, ldsBefore, client.InNamespace(namespace))).To(Succeed())
			initialLDCount := len(ldsBefore.Items)

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred(), "ensureLocalDisks should not return an error when LocalDisk has no FSC owner")
			Expect(changed).To(BeTrue(), "ensureLocalDisks should report changed when it updates FSC status")

			// Verify FSC status was updated
			updatedFSC := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updatedFSC)).To(Succeed())

			// DeviceValidated condition should be False with ReasonDeviceValidationFailed
			deviceValidatedCond := findCondition(updatedFSC.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(deviceValidatedCond).NotTo(BeNil(), "DeviceValidated condition must be set")
			Expect(deviceValidatedCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(deviceValidatedCond.Reason).To(Equal(ReasonDeviceValidationFailed))
			Expect(deviceValidatedCond.Message).To(ContainSubstring("already in use"), "message should indicate device is already in use")
			Expect(deviceValidatedCond.Message).To(ContainSubstring("unknown"), "message should contain 'unknown' fallback when no FSC owner is found")
			Expect(deviceValidatedCond.Message).To(ContainSubstring(devPath), "message should mention the device path")

			// Ready condition should be False with ReasonValidationFailed
			readyCond := findCondition(updatedFSC.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(readyCond).NotTo(BeNil(), "Ready condition must be set")
			Expect(readyCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(readyCond.Reason).To(Equal(ReasonValidationFailed))
			Expect(readyCond.Message).NotTo(BeEmpty(), "Ready condition should have a message explaining the validation failure")

			// Assert that no additional LocalDisk resources are created
			ldsAfter := &unstructured.UnstructuredList{}
			ldsAfter.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskList,
			})
			Expect(fakeClient.List(ctx, ldsAfter, client.InNamespace(namespace))).To(Succeed())
			Expect(ldsAfter.Items).To(HaveLen(
				initialLDCount),
				"No additional LocalDisk should be created when ownership conflict occurs",
			)
		})

		It("should handle validation error when device not found", func() {
			// Set operator namespace
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/missing-device"},
				},
			}

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node-1",
					Labels: map[string]string{
						WorkerNodeRoleLabel:   "",
						ScaleStorageRoleLabel: ScaleStorageRoleValue,
					},
				},
			}

			// Create LVDR without the device
			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node-1",
					Namespace: operatorNS,
				},
				Spec: fusionv1alpha1.LocalVolumeDiscoveryResultSpec{
					NodeName: "storage-node-1",
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							Path: "/dev/nvme0n1", // Different device
							WWN:  "uuid.12345678",
						},
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node, lvdr).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify validation failed condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonDeviceValidationFailed))
		})

		It("should handle error when no storage nodes found", func() {
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1"},
				},
			}

			// Create node WITHOUT storage labels
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "worker-node-1",
					Labels: map[string]string{
						WorkerNodeRoleLabel: "", // Only worker, no storage label
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify error condition
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonDeviceValidationFailed))
			Expect(cond.Message).To(ContainSubstring("no nodes found"))
		})

		It("should create LocalDisks when validation already passed", func() {
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1"},
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeDeviceValidated,
							Status: metav1.ConditionTrue, // Already validated
							Reason: ReasonDeviceValidationSucceeded,
						},
					},
				},
			}

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node-1",
					Labels: map[string]string{
						WorkerNodeRoleLabel:   "",
						ScaleStorageRoleLabel: ScaleStorageRoleValue,
					},
				},
			}

			// Create LVDR with the device
			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node-1",
					Namespace: operatorNS,
				},
				Spec: fusionv1alpha1.LocalVolumeDiscoveryResultSpec{
					NodeName: "storage-node-1",
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							Path: "/dev/nvme0n1",
							WWN:  "uuid.12345678-1234-1234-1234-123456789abc",
						},
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node, lvdr).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify LocalDisk was created
			ldList := &unstructured.UnstructuredList{}
			ldList.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskList,
			})
			Expect(fakeClient.List(ctx, ldList, client.InNamespace(fsc.Namespace))).To(Succeed())
			Expect(ldList.Items).To(HaveLen(1))

			// Verify name format: raw WWN (e.g., uuid.12345678-...)
			ldName := ldList.Items[0].GetName()
			Expect(ldName).To(Equal("uuid.12345678-1234-1234-1234-123456789abc"))

			// Verify condition set to InProgress
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeLocalDiskCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonLocalDiskCreationInProgress))
		})

		It("should skip creation when LocalDisk already exists", func() {
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1"},
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeDeviceValidated,
							Status: metav1.ConditionTrue,
							Reason: ReasonDeviceValidationSucceeded,
						},
					},
				},
			}

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node-1",
					Labels: map[string]string{
						WorkerNodeRoleLabel:   "",
						ScaleStorageRoleLabel: ScaleStorageRoleValue,
					},
				},
			}

			// Create LVDR
			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node-1",
					Namespace: operatorNS,
				},
				Spec: fusionv1alpha1.LocalVolumeDiscoveryResultSpec{
					NodeName: "storage-node-1",
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							Path: "/dev/nvme0n1",
							WWN:  "uuid.12345678-1234-1234-1234-123456789abc",
						},
					},
				},
			}

			// Pre-create LocalDisk (already exists) with raw WWN name
			ld := &unstructured.Unstructured{}
			ld.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskKind,
			})
			ld.SetName("uuid.12345678-1234-1234-1234-123456789abc")
			ld.SetNamespace(fsc.Namespace)
			ld.SetOwnerReferences([]metav1.OwnerReference{
				{
					APIVersion: "fusion.storage.openshift.io/v1alpha1",
					Kind:       "FileSystemClaim",
					Name:       fsc.Name,
					UID:        fsc.UID,
				},
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node, lvdr, ld).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse()) // No change, LD already exists

			// Verify status conditions remain stable (DeviceValidated=True, no error conditions)
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			// DeviceValidated should remain True
			deviceValidatedCond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(deviceValidatedCond).NotTo(BeNil())
			Expect(deviceValidatedCond.Status).To(Equal(metav1.ConditionTrue))
			Expect(deviceValidatedCond.Reason).To(Equal(ReasonDeviceValidationSucceeded))

			// No error conditions should be set
			readyCond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			if readyCond != nil {
				Expect(readyCond.Reason).NotTo(Equal(ReasonValidationFailed), "Ready condition should not be set to ValidationFailed")
			}
		})

		It("should handle error when no storage nodes available", func() {
			// UPDATED TEST: With atomic validation, the error is caught during validation phase
			// (no storage nodes = validation fails) rather than at getRandomStorageNode phase
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1"},
				},
			}

			// No storage nodes available
			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify validation error condition (fails during device validation)
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			// With atomic validation, this now fails at validation stage, not LocalDisk creation
			// Verify DeviceValidated condition
			deviceValidatedCond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(deviceValidatedCond).NotTo(BeNil())
			Expect(deviceValidatedCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(deviceValidatedCond.Reason).To(Equal(ReasonDeviceValidationFailed))
			Expect(deviceValidatedCond.Message).To(ContainSubstring("no nodes found"))

			// Verify Ready condition
			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonValidationFailed))
			Expect(cond.Message).To(ContainSubstring("no nodes found"))
		})

		It("should handle error when device not found in LVDR", func() {
			// UPDATED TEST: With atomic validation, device validation catches this error
			// The device isn't in LVDR, so validation fails before attempting WWN lookup
			// Also verify that both Ready and DeviceValidated conditions surface the LVDR
			// validation error (ReasonValidationFailed / ReasonDeviceValidationFailed),
			// and that their messages contain the missing device path.
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			devPath := "/dev/nvme0n1"
			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{devPath},
				},
			}

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node-1",
					Labels: map[string]string{
						WorkerNodeRoleLabel:   "",
						ScaleStorageRoleLabel: ScaleStorageRoleValue,
					},
				},
			}

			// Create LVDR but WITHOUT the requested device
			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node-1",
					Namespace: operatorNS,
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							Path: "/dev/sda", // Different device
							WWN:  "uuid.other",
						},
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node, lvdr).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify validation error (device not found in LVDR)
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			// With atomic validation, error is caught during validation
			// Verify DeviceValidated condition
			deviceValidatedCond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeDeviceValidated)
			Expect(deviceValidatedCond).NotTo(BeNil())
			Expect(deviceValidatedCond.Status).To(Equal(metav1.ConditionFalse))
			Expect(deviceValidatedCond.Reason).To(Equal(ReasonDeviceValidationFailed))
			Expect(deviceValidatedCond.Message).To(ContainSubstring(devPath))

			// Verify Ready condition
			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonValidationFailed))
			Expect(cond.Message).To(ContainSubstring(devPath))
		})

		It("should create multiple LocalDisks for multiple devices", func() {
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1", "/dev/nvme1n1"}, // Multiple devices
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:   fusionv1alpha1.ConditionTypeDeviceValidated,
							Status: metav1.ConditionTrue,
							Reason: ReasonDeviceValidationSucceeded,
						},
					},
				},
			}

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node-1",
					Labels: map[string]string{
						WorkerNodeRoleLabel:   "",
						ScaleStorageRoleLabel: ScaleStorageRoleValue,
					},
				},
			}

			// Create LVDR with both devices
			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node-1",
					Namespace: operatorNS,
				},
				Spec: fusionv1alpha1.LocalVolumeDiscoveryResultSpec{
					NodeName: "storage-node-1",
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							Path: "/dev/nvme0n1",
							WWN:  "uuid.aaaa-1111-2222-3333-bbbbbbbbbbbb",
						},
						{
							Path: "/dev/nvme1n1",
							WWN:  "uuid.cccc-4444-5555-6666-dddddddddddd",
						},
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node, lvdr).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify 2 LocalDisks were created
			ldList := &unstructured.UnstructuredList{}
			ldList.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   LocalDiskGroup,
				Version: LocalDiskVersion,
				Kind:    LocalDiskList,
			})
			Expect(fakeClient.List(ctx, ldList, client.InNamespace(fsc.Namespace))).To(Succeed())
			Expect(ldList.Items).To(HaveLen(2))

			// Verify both devices are represented by their WWN names
			names := []string{ldList.Items[0].GetName(), ldList.Items[1].GetName()}
			Expect(names).To(ContainElement("uuid.aaaa-1111-2222-3333-bbbbbbbbbbbb"))
			Expect(names).To(ContainElement("uuid.cccc-4444-5555-6666-dddddddddddd"))
		})

		It("should be idempotent when condition is already set correctly", func() {
			operatorNS := "test-operator-ns"
			GinkgoT().Setenv("DEPLOYMENT_NAMESPACE", operatorNS)

			fsc := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fsc",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1"},
				},
				Status: fusionv1alpha1.FileSystemClaimStatus{
					Conditions: []metav1.Condition{
						{
							Type:    fusionv1alpha1.ConditionTypeDeviceValidated,
							Status:  metav1.ConditionTrue,
							Reason:  ReasonDeviceValidationSucceeded,
							Message: "Device(s) validation succeeded",
						},
					},
				},
			}

			// Create storage node
			node := &corev1.Node{
				ObjectMeta: metav1.ObjectMeta{
					Name: "storage-node-1",
					Labels: map[string]string{
						WorkerNodeRoleLabel:   "",
						ScaleStorageRoleLabel: ScaleStorageRoleValue,
					},
				},
			}

			// Create LVDR
			lvdr := &fusionv1alpha1.LocalVolumeDiscoveryResult{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "discovery-result-storage-node-1",
					Namespace: operatorNS,
				},
				Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
					DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
						{
							Path: "/dev/nvme0n1",
							WWN:  "uuid.12345678-1234-1234-1234-123456789abc",
						},
					},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, node, lvdr).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			// First call - should validate
			changed, err := reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Get updated FSC
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, fsc)).To(Succeed())

			// Second call with same FSC - should skip validation (already validated)
			// LD already exists now, so should return false
			// This tests the idempotent behavior when LD exists (line 410)
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, fsc)).To(Succeed())
			changed, err = reconciler.ensureLocalDisks(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse()) // LD already exists, no change
		})
	})

	Describe("ensureFileSystem", func() {
		It("should skip when LocalDiskCreated is not True", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				localDiskCreatedCondition(metav1.ConditionFalse, ReasonLocalDiskCreationInProgress),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureFileSystem(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())
		})

		It("should skip when no owned LocalDisks found", func() {
			fsc := createTestFSC("test-fsc", namespace, nil, []metav1.Condition{
				localDiskCreatedCondition(metav1.ConditionTrue, ReasonLocalDiskCreationSucceeded),
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureFileSystem(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse())
		})

		It("should create Filesystem when none exists", func() {
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

			// Create LocalDisks - these ARE needed because ensureFilesystem still queries
			// for owned LocalDisks to extract their names and build the Filesystem spec
			// The condition check just gates whether we proceed; the names are still required
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

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, ld1).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureFileSystem(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue())

			// Verify Filesystem was created
			fsList := &unstructured.UnstructuredList{}
			fsList.SetGroupVersionKind(schema.GroupVersionKind{
				Group:   FileSystemGroup,
				Version: FileSystemVersion,
				Kind:    FileSystemList,
			})
			Expect(fakeClient.List(ctx, fsList, client.InNamespace(fsc.Namespace))).To(Succeed())
			Expect(fsList.Items).To(HaveLen(1))
			Expect(fsList.Items[0].GetName()).To(Equal(fsc.Name))

			// Verify condition set to InProgress
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeFileSystemCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonFileSystemCreationInProgress))
		})

		It("should not change when Filesystem exists with correct spec", func() {
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

			// Create LocalDisk
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

			// Create Filesystem with correct spec
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

			// Set correct spec
			desiredSpec := buildFilesystemSpec([]string{"test-ld-1"})
			fs.Object["spec"] = desiredSpec

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fsc, ld1, fs).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureFileSystem(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeFalse()) // No drift, no change
		})

		It("should handle error when multiple Filesystems exist", func() {
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

			// Create LocalDisk
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
				WithObjects(fsc, ld1, fs1, fs2).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			reconciler := &FileSystemClaimReconciler{
				Client: fakeClient,
				Scheme: scheme,
			}

			changed, err := reconciler.ensureFileSystem(ctx, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(changed).To(BeTrue()) // Error was handled, status updated

			// Verify error condition was set
			updated := &fusionv1alpha1.FileSystemClaim{}
			Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

			cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeFileSystemCreated)
			Expect(cond).NotTo(BeNil())
			Expect(cond.Status).To(Equal(metav1.ConditionFalse))
			Expect(cond.Reason).To(Equal(ReasonFileSystemCreationFailed))
		})
	})

	Describe("Device Update Protection", func() {
		Context("Controller Safety Check - Detect spec.devices mismatch", func() {
			It("should detect and block when spec.devices changed after LocalDisks created", func() {
				// Scenario: Webhook is bypassed and spec.devices is modified
				fsc := &fusionv1alpha1.FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: namespace,
					},
					Spec: fusionv1alpha1.FileSystemClaimSpec{
						Devices: []string{"/dev/nvme500n500"}, // Changed from original
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

				// Create LocalDisk with original device path using helper
				ld1 := createLocalDiskWithOwner("test-ld-1", fsc.Namespace, "/dev/nvme1n1", "node1", fsc)

				fakeClient := fake.NewClientBuilder().
					WithScheme(scheme).
					WithObjects(fsc, ld1).
					WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
					Build()

				reconciler := &FileSystemClaimReconciler{
					Client: fakeClient,
					Scheme: scheme,
				}

				// Controller should detect the mismatch
				changed, err := reconciler.ensureLocalDisks(ctx, fsc)
				Expect(err).NotTo(HaveOccurred())
				Expect(changed).To(BeTrue())

				// Verify error condition was set
				updated := &fusionv1alpha1.FileSystemClaim{}
				Expect(fakeClient.Get(ctx, types.NamespacedName{Name: fsc.Name, Namespace: fsc.Namespace}, updated)).To(Succeed())

				cond := findCondition(updated.Status.Conditions, fusionv1alpha1.ConditionTypeReady)
				Expect(cond).NotTo(BeNil())
				Expect(cond.Status).To(Equal(metav1.ConditionFalse))
				Expect(cond.Reason).To(Equal(ReasonImmutableFieldModified))
				Expect(cond.Message).To(ContainSubstring("spec.devices was modified after LocalDisks were created"))
				Expect(cond.Message).To(ContainSubstring("Original:"))
				Expect(cond.Message).To(ContainSubstring("Current:"))
				Expect(cond.Message).To(ContainSubstring("/dev/nvme1n1"))
			})

			It("should allow when spec.devices matches owned LocalDisks", func() {
				fsc := &fusionv1alpha1.FileSystemClaim{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "test-fsc",
						Namespace: namespace,
					},
					Spec: fusionv1alpha1.FileSystemClaimSpec{
						Devices: []string{"/dev/nvme1n1", "/dev/nvme2n2"},
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

				// Create LocalDisks matching spec.devices using helpers
				ld1 := createLocalDiskWithOwner("test-ld-1", fsc.Namespace, "/dev/nvme1n1", "node1", fsc)
				ld2 := createLocalDiskWithOwner("test-ld-2", fsc.Namespace, "/dev/nvme2n2", "node1", fsc)

				fakeClient := fake.NewClientBuilder().
					WithScheme(scheme).
					WithObjects(fsc, ld1, ld2).
					WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
					Build()

				reconciler := &FileSystemClaimReconciler{
					Client: fakeClient,
					Scheme: scheme,
				}

				// Controller should allow - devices match
				changed, err := reconciler.ensureLocalDisks(ctx, fsc)
				Expect(err).NotTo(HaveOccurred())
				Expect(changed).To(BeFalse()) // No change needed
			})
		})
	})
})
