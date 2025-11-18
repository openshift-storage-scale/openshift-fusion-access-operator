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

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	storagev1 "k8s.io/api/storage/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
)

var _ = Describe("Migration Helper Functions", func() {
	var (
		ctx       context.Context
		scheme    *runtime.Scheme
		namespace = MigrationNamespace
	)

	BeforeEach(func() {
		ctx = context.Background()
		scheme = runtime.NewScheme()
		Expect(clientgoscheme.AddToScheme(scheme)).To(Succeed())
		Expect(fusionv1alpha1.AddToScheme(scheme)).To(Succeed())
	})

	Describe("matchesWWNPattern", func() {
		It("should match uuid prefix", func() {
			Expect(matchesWWNPattern("uuid.12345678-1234-1234-1234-123456789abc")).To(BeTrue())
		})

		It("should match eui prefix", func() {
			Expect(matchesWWNPattern("eui.0025388200000001")).To(BeTrue())
		})

		It("should match 0x prefix", func() {
			Expect(matchesWWNPattern("0x5000c50089876543")).To(BeTrue())
		})

		It("should not match invalid patterns", func() {
			Expect(matchesWWNPattern("nvme0n1")).To(BeFalse())
			Expect(matchesWWNPattern("sda")).To(BeFalse())
			Expect(matchesWWNPattern("disk-123")).To(BeFalse())
			Expect(matchesWWNPattern("")).To(BeFalse())
		})
	})

	Describe("isV1LocalDisk", func() {
		It("should identify valid v1.0 LocalDisk", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			Expect(isV1LocalDisk(ld)).To(BeTrue())
		})

		It("should reject LocalDisk with migration label", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld.SetLabels(map[string]string{
				MigrationLabelMigrated: MigrationLabelValueTrue,
			})
			Expect(isV1LocalDisk(ld)).To(BeFalse())
		})

		It("should reject LocalDisk with skip label", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld.SetLabels(map[string]string{
				MigrationLabelSkip: MigrationLabelValueTrue,
			})
			Expect(isV1LocalDisk(ld)).To(BeFalse())
		})

		It("should reject LocalDisk with FSC ownerRef", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld.SetOwnerReferences([]metav1.OwnerReference{
				{
					Kind: FileSystemClaimKind,
					Name: "test-fsc",
				},
			})
			Expect(isV1LocalDisk(ld)).To(BeFalse())
		})

		It("should reject LocalDisk with invalid name pattern", func() {
			ld := createV1LocalDisk("nvme0n1", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			Expect(isV1LocalDisk(ld)).To(BeFalse())
		})

		It("should reject LocalDisk without status.filesystem", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "")
			Expect(isV1LocalDisk(ld)).To(BeFalse())
		})
	})

	Describe("groupLocalDisksByFilesystem", func() {
		It("should group LocalDisks by filesystem name", func() {
			ld1 := createV1LocalDisk("uuid.ld1", namespace, "/dev/nvme0n1", "worker-1", "fs1")
			ld2 := createV1LocalDisk("uuid.ld2", namespace, "/dev/nvme1n1", "worker-2", "fs1")
			ld3 := createV1LocalDisk("uuid.ld3", namespace, "/dev/nvme2n1", "worker-3", "fs2")

			groups := groupLocalDisksByFilesystem([]*unstructured.Unstructured{ld1, ld2, ld3})

			Expect(groups).To(HaveLen(2))
			Expect(groups["fs1"].LocalDisks).To(HaveLen(2))
			Expect(groups["fs1"].DevicePaths).To(ConsistOf("/dev/nvme0n1", "/dev/nvme1n1"))
			Expect(groups["fs2"].LocalDisks).To(HaveLen(1))
			Expect(groups["fs2"].DevicePaths).To(ConsistOf("/dev/nvme2n1"))
		})

		It("should handle empty input", func() {
			groups := groupLocalDisksByFilesystem([]*unstructured.Unstructured{})
			Expect(groups).To(BeEmpty())
		})
	})

	Describe("hasOwnerRefToFSC", func() {
		It("should return true when object has matching FSC ownerRef", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld.SetOwnerReferences([]metav1.OwnerReference{
				{
					Kind: FileSystemClaimKind,
					Name: "test-fsc",
				},
			})
			Expect(hasOwnerRefToFSC(ld, "test-fsc")).To(BeTrue())
		})

		It("should return false when object has no ownerRefs", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			Expect(hasOwnerRefToFSC(ld, "test-fsc")).To(BeFalse())
		})

		It("should return false when object has different FSC ownerRef", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld.SetOwnerReferences([]metav1.OwnerReference{
				{
					Kind: FileSystemClaimKind,
					Name: "other-fsc",
				},
			})
			Expect(hasOwnerRefToFSC(ld, "test-fsc")).To(BeFalse())
		})

		It("should return false when object has non-FSC ownerRef", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld.SetOwnerReferences([]metav1.OwnerReference{
				{
					Kind: "SomeOtherKind",
					Name: "test-fsc",
				},
			})
			Expect(hasOwnerRefToFSC(ld, "test-fsc")).To(BeFalse())
		})
	})

	Describe("discoverLegacyLocalDisks", func() {
		It("should discover valid v1.0 LocalDisks", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(ld).
				Build()

			localDisks, err := discoverLegacyLocalDisks(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())
			Expect(localDisks).To(HaveLen(1))
			Expect(localDisks[0].GetName()).To(Equal("uuid.12345678"))
		})

		It("should skip already migrated LocalDisks", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld.SetLabels(map[string]string{
				MigrationLabelMigrated: MigrationLabelValueTrue,
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(ld).
				Build()

			localDisks, err := discoverLegacyLocalDisks(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())
			Expect(localDisks).To(BeEmpty())
		})

		It("should skip LocalDisks with invalid names", func() {
			ld := createV1LocalDisk("invalid-name", namespace, "/dev/nvme0n1", "worker-1", "test-fs")

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(ld).
				Build()

			localDisks, err := discoverLegacyLocalDisks(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())
			Expect(localDisks).To(BeEmpty())
		})
	})

	Describe("validateResourceGroup", func() {
		It("should validate group with Filesystem and StorageClass", func() {
			fs := createV1Filesystem("test-fs", namespace)
			sc := &storagev1.StorageClass{
				ObjectMeta: metav1.ObjectMeta{
					Name: "test-fs",
				},
				Provisioner: "spectrumscale.csi.ibm.com",
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fs, sc).
				Build()

			group := &LegacyResourceGroup{
				FilesystemName: "test-fs",
				DevicePaths:    []string{"/dev/nvme0n1"},
			}

			err := validateResourceGroup(ctx, fakeClient, group)
			Expect(err).NotTo(HaveOccurred())
			Expect(group.Filesystem).NotTo(BeNil())
			Expect(group.StorageClass).NotTo(BeNil())
		})

		It("should fail when Filesystem doesn't exist", func() {
			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				Build()

			group := &LegacyResourceGroup{
				FilesystemName: "test-fs",
				DevicePaths:    []string{"/dev/nvme0n1"},
			}

			err := validateResourceGroup(ctx, fakeClient, group)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("filesystem test-fs not found"))
		})

		It("should succeed when StorageClass doesn't exist", func() {
			fs := createV1Filesystem("test-fs", namespace)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fs).
				Build()

			group := &LegacyResourceGroup{
				FilesystemName: "test-fs",
				DevicePaths:    []string{"/dev/nvme0n1"},
			}

			err := validateResourceGroup(ctx, fakeClient, group)
			Expect(err).NotTo(HaveOccurred())
			Expect(group.Filesystem).NotTo(BeNil())
			Expect(group.StorageClass).To(BeNil())
		})

		It("should fail when StorageClass has wrong provisioner", func() {
			fs := createV1Filesystem("test-fs", namespace)
			sc := &storagev1.StorageClass{
				ObjectMeta: metav1.ObjectMeta{
					Name: "test-fs",
				},
				Provisioner: "kubernetes.io/aws-ebs",
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(fs, sc).
				Build()

			group := &LegacyResourceGroup{
				FilesystemName: "test-fs",
				DevicePaths:    []string{"/dev/nvme0n1"},
			}

			err := validateResourceGroup(ctx, fakeClient, group)
			Expect(err).To(HaveOccurred())
			Expect(err.Error()).To(ContainSubstring("wrong provisioner"))
		})
	})

	Describe("Full Migration Flow", func() {
		It("should successfully migrate a complete resource group", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			fs := createV1Filesystem("test-fs", namespace)
			sc := &storagev1.StorageClass{
				ObjectMeta: metav1.ObjectMeta{
					Name: "test-fs",
				},
				Provisioner: "spectrumscale.csi.ibm.com",
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(ld, fs, sc).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			err := RunMigration(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())

			// Verify FSC was created
			fsc := &fusionv1alpha1.FileSystemClaim{}
			err = fakeClient.Get(ctx, client.ObjectKey{
				Name:      "test-fs",
				Namespace: namespace,
			}, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(fsc.Spec.Devices).To(ConsistOf("/dev/nvme0n1"))
			Expect(fsc.Labels[MigrationLabelMigrated]).To(Equal(MigrationLabelValueTrue))
			Expect(fsc.Labels[MigrationLabelSource]).To(Equal(MigrationSourceV1))

			// Verify FSC status conditions
			Expect(fsc.Status.Conditions).NotTo(BeEmpty())
			for _, cond := range fsc.Status.Conditions {
				Expect(cond.Status).To(Equal(metav1.ConditionTrue))
				Expect(cond.Reason).To(Equal(MigrationReasonComplete))
				Expect(cond.ObservedGeneration).To(Equal(InitialObservedGeneration))
			}

			// Verify LocalDisk was updated
			updatedLD := createV1LocalDisk("", "", "", "", "")
			err = fakeClient.Get(ctx, client.ObjectKey{
				Name:      "uuid.12345678",
				Namespace: namespace,
			}, updatedLD)
			Expect(err).NotTo(HaveOccurred())

			ownerRefs := updatedLD.GetOwnerReferences()
			Expect(ownerRefs).To(HaveLen(1))
			Expect(ownerRefs[0].Kind).To(Equal(FileSystemClaimKind))
			Expect(ownerRefs[0].Name).To(Equal("test-fs"))

			labels := updatedLD.GetLabels()
			Expect(labels[MigrationLabelMigrated]).To(Equal(MigrationLabelValueTrue))
			Expect(labels[FileSystemClaimOwnedByNameLabel]).To(Equal("test-fs"))

			// Verify StorageClass was updated (labels only, no ownerRef)
			updatedSC := &storagev1.StorageClass{}
			err = fakeClient.Get(ctx, client.ObjectKey{Name: "test-fs"}, updatedSC)
			Expect(err).NotTo(HaveOccurred())

			Expect(updatedSC.Labels[MigrationLabelMigrated]).To(Equal(MigrationLabelValueTrue))
			Expect(updatedSC.Labels[FileSystemClaimOwnedByNameLabel]).To(Equal("test-fs"))
			Expect(updatedSC.OwnerReferences).To(BeEmpty())
		})

		It("should be idempotent - running twice should not cause errors", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			fs := createV1Filesystem("test-fs", namespace)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(ld, fs).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			// Run migration first time
			err := RunMigration(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())

			// Run migration second time - should be idempotent
			err = RunMigration(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())

			// Verify only one FSC exists
			fscList := &fusionv1alpha1.FileSystemClaimList{}
			err = fakeClient.List(ctx, fscList, client.InNamespace(namespace))
			Expect(err).NotTo(HaveOccurred())
			Expect(fscList.Items).To(HaveLen(1))
		})

		It("should handle multiple LocalDisks for one Filesystem", func() {
			ld1 := createV1LocalDisk("uuid.ld1", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld2 := createV1LocalDisk("uuid.ld2", namespace, "/dev/nvme1n1", "worker-2", "test-fs")
			fs := createV1Filesystem("test-fs", namespace)

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(ld1, ld2, fs).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			err := RunMigration(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())

			// Verify FSC has both devices
			fsc := &fusionv1alpha1.FileSystemClaim{}
			err = fakeClient.Get(ctx, client.ObjectKey{
				Name:      "test-fs",
				Namespace: namespace,
			}, fsc)
			Expect(err).NotTo(HaveOccurred())
			Expect(fsc.Spec.Devices).To(HaveLen(2))
			Expect(fsc.Spec.Devices).To(ConsistOf("/dev/nvme0n1", "/dev/nvme1n1"))

			// Verify both LocalDisks have ownerRef
			for _, ldName := range []string{"uuid.ld1", "uuid.ld2"} {
				updatedLD := createV1LocalDisk("", "", "", "", "")
				err = fakeClient.Get(ctx, client.ObjectKey{
					Name:      ldName,
					Namespace: namespace,
				}, updatedLD)
				Expect(err).NotTo(HaveOccurred())

				ownerRefs := updatedLD.GetOwnerReferences()
				Expect(ownerRefs).To(HaveLen(1))
				Expect(ownerRefs[0].Name).To(Equal("test-fs"))
			}
		})

		It("should skip resources with skip-migration label", func() {
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			ld.SetLabels(map[string]string{
				MigrationLabelSkip: MigrationLabelValueTrue,
			})

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(ld).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			err := RunMigration(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())

			// Verify no FSC was created
			fscList := &fusionv1alpha1.FileSystemClaimList{}
			err = fakeClient.List(ctx, fscList, client.InNamespace(namespace))
			Expect(err).NotTo(HaveOccurred())
			Expect(fscList.Items).To(BeEmpty())
		})

		It("should update LocalDisk ownerRefs when FSC already exists", func() {
			// Create v1.0 resources
			ld := createV1LocalDisk("uuid.12345678", namespace, "/dev/nvme0n1", "worker-1", "test-fs")
			fs := createV1Filesystem("test-fs", namespace)

			// Create FSC that already exists (from manual creation or previous migration)
			existingFSC := &fusionv1alpha1.FileSystemClaim{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-fs",
					Namespace: namespace,
				},
				Spec: fusionv1alpha1.FileSystemClaimSpec{
					Devices: []string{"/dev/nvme0n1"},
				},
			}

			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(ld, fs, existingFSC).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			err := RunMigration(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())

			// Verify LocalDisk got ownerRef even though FSC already existed
			updatedLD := createV1LocalDisk("", "", "", "", "")
			err = fakeClient.Get(ctx, client.ObjectKey{
				Name:      "uuid.12345678",
				Namespace: namespace,
			}, updatedLD)
			Expect(err).NotTo(HaveOccurred())

			ownerRefs := updatedLD.GetOwnerReferences()
			Expect(ownerRefs).To(HaveLen(1))
			Expect(ownerRefs[0].Kind).To(Equal(FileSystemClaimKind))
			Expect(ownerRefs[0].Name).To(Equal("test-fs"))
		})

		It("should handle discovery phase errors gracefully", func() {
			// Empty cluster - no resources to migrate
			fakeClient := fake.NewClientBuilder().
				WithScheme(scheme).
				WithStatusSubresource(&fusionv1alpha1.FileSystemClaim{}).
				Build()

			err := RunMigration(ctx, fakeClient)
			Expect(err).NotTo(HaveOccurred())
		})
	})
})
