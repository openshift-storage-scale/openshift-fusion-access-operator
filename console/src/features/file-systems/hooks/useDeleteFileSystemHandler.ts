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
import { getFileSystemScs as getFileSystemStorageClasses } from "../utils/filesystem";
import type { FileSystemsTabViewModel } from "./useFileSystemsTabViewModel";
import { hasLabel } from "@/shared/utils/console/K8sResourceCommon";

type DeleteFileSystemsHandler = () => Promise<void>;

export const useDeleteFileSystemsHandler = (
  vm: FileSystemsTabViewModel["deleteModal"]
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
    if (!vm.state.fileSystem) {
      return;
    }

    const [fsName, fsNamespace] = [
      vm.state.fileSystem.metadata?.name,
      vm.state.fileSystem.metadata?.namespace,
    ];

    if (!fsName || !fsNamespace) {
      return;
    }

    vm.actions.setIsDeleting(true);
    vm.actions.setErrors([]);

    try {
      if (!hasLabel(vm.state.fileSystem, FS_ALLOW_DELETE_LABEL)) {
        await k8sPatch({
          model: fileSystemModel,
          ns: fsNamespace,
          resource: vm.state.fileSystem,
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
        resource: vm.state.fileSystem,
      });

      const fileSystemStorageClasses = getFileSystemStorageClasses(
        vm.state.fileSystem,
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
        vm.state.fileSystem.spec?.local?.pools.reduce((disks, pool) => {
          pool.disks.forEach((d) => disks.add(d));
          return disks;
        }, new Set<string>()) ?? []
      );

      if (disks.length > 0) {
        // This is a temporary workaround. We need to clean-up the LocalDisk-s too
        // There is a webhook that disallows deleting LocalDisks if FileSystem still exists
        // We periodically check if the FileSystem still exists. Once it is gone, we delete the LocalDisk-s
        let exists = true;
        while (exists) {
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
          try {
            await k8sGet({
              model: fileSystemModel,
              ns: fsNamespace,
              name: fsName,
            });
          } catch {
            exists = false;
          }
        }

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
          vm.actions.setIsDeleting(false);
          vm.actions.setErrors([
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
          return;
        }
      }
      vm.actions.setIsOpen(false);
    } catch (e) {
      vm.actions.setIsDeleting(false);
      const description = e instanceof Error ? e.message : (e as string);
      vm.actions.setErrors([description]);
    }
  }, [
    fileSystemModel,
    storageClasses,
    storageClassModel,
    localDiskModel,
    t,
    vm.actions,
    vm.state.fileSystem,
  ]);

  return deleteFileSystemsHandler;
};
