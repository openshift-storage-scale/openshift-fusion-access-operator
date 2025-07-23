import { useCallback } from "react";
import {
  type StorageClass,
  useK8sModel,
  useK8sWatchResource,
  k8sPatch,
  k8sDelete,
  k8sGet,
} from "@openshift-console/dynamic-plugin-sdk";
import { FS_ALLOW_DELETE_LABEL } from "@/constants";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { getFileSystemStorageClasses } from "../utils/FileSystems";
import type { FileSystemsTableViewModel } from "./useFileSystemsTableViewModel";
import { hasLabel } from "@/shared/utils/console/K8sResourceCommon";
import { waitForLocalDiskUsedConditionFalse } from "@/shared/utils/console/LocalDiskWaiter";

type DeleteFileSystemsHandler = () => Promise<void>;

export const useDeleteFileSystemsHandler = (
  vm: FileSystemsTableViewModel["deleteModal"]
): DeleteFileSystemsHandler => {
  const { t } = useFusionAccessTranslations();

  const [fileSystemModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "Filesystem",
  });

  const [localDiskModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "LocalDisk",
  });

  const [storageClassModel] = useK8sModel({
    group: "storage.k8s.io",
    version: "v1",
    kind: "StorageClass",
  });

  const [storageClasses] = useK8sWatchResource<StorageClass[]>({
    groupVersionKind: {
      kind: "StorageClass",
      group: "storage.k8s.io",
      version: "v1",
    },
    isList: true,
    namespaced: false,
  });

  const deleteFileSystemsHandler = useCallback(async () => {
    if (!vm.fileSystem) {
      return;
    }

    const [fsName, fsNamespace] = [
      vm.fileSystem.metadata?.name,
      vm.fileSystem.metadata?.namespace,
    ];

    if (!fsName || !fsNamespace) {
      return;
    }

    vm.setErrors([]);
    vm.setIsDeleting(true);

    try {
      if (!hasLabel(vm.fileSystem, FS_ALLOW_DELETE_LABEL)) {
        await k8sPatch({
          model: fileSystemModel,
          ns: fsNamespace,
          resource: vm.fileSystem,
          data: [
            {
              op: "add",
              path: "/metadata/labels",
              value: { [FS_ALLOW_DELETE_LABEL]: "" },
            },
          ],
        });
      }

      await k8sDelete({
        model: fileSystemModel,
        ns: fsNamespace,
        resource: vm.fileSystem,
      });

      const fileSystemStorageClasses = getFileSystemStorageClasses(
        vm.fileSystem,
        storageClasses
      );

      await Promise.allSettled(
        fileSystemStorageClasses.map((sc) =>
          k8sDelete({
            model: storageClassModel,
            resource: sc,
          })
        )
      );

      const disks = Array.from(
        vm.fileSystem.spec?.local?.pools.reduce((disks: Set<string>, pool: any) => {
          pool.disks.forEach((d: string) => disks.add(d));
          return disks;
        }, new Set<string>()) ?? []
      );

      if (disks.length > 0) {
        // Wait for each LocalDisk to have "Used" condition become "False" before deletion
        // This ensures the LocalDisk is no longer in use by the FileSystem
        const waitPromises = (disks as string[]).map(async (diskName: string) => {
          try {
            await waitForLocalDiskUsedConditionFalse({
              name: diskName,
              namespace: fsNamespace,
              model: localDiskModel,
            });
          } catch (error) {
            console.warn(`Failed to wait for LocalDisk ${diskName} "Used" condition:`, error);
            // Continue with deletion even if wait fails - might be already unused
          }
        });

        // Wait for all disks to be ready for deletion (or timeout)
        await Promise.allSettled(waitPromises);

        const diskDeletions = await Promise.allSettled(
          disks.map((d) =>
            k8sDelete({
              model: localDiskModel,
              ns: fsNamespace,
              resource: {
                metadata: {
                  namespace: fsNamespace,
                  name: d,
                },
              },
            })
          )
        );

        const failedDiskRemovals = diskDeletions.some(
          (d) => d.status === "rejected"
        );

        if (failedDiskRemovals) {
          vm.setErrors([
            t("Failed to delete the following local disks:"),
            ...diskDeletions.reduce((acc, curr, idx) => {
              if (curr.status === "rejected") {
                const description =
                  curr.reason instanceof Error
                    ? curr.reason.message
                    : (curr.reason as string);
                acc.push(`${disks?.[idx] || ""} - ${description}`);
              }
              return acc;
            }, [] as string[]),
          ]);
          vm.setIsDeleting(false);
          return;
        }
      }

      vm.setIsOpen(false);
    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      vm.setErrors([description]);
    }

    vm.setIsDeleting(false);
  }, [
    vm,
    fileSystemModel,
    storageClasses,
    storageClassModel,
    localDiskModel,
    t,
  ]);

  return deleteFileSystemsHandler;
};
