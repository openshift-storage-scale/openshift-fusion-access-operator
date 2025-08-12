import { useCallback } from "react";
import {
  k8sCreate,
  useK8sModel,
  type K8sModel,
  type StorageClass,
} from "@openshift-console/dynamic-plugin-sdk";
import { SC_PROVISIONER } from "@/constants";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import type { LocalDisk } from "@/shared/types/ibm-spectrum-scale/LocalDisk";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";
import type { LunsViewModel } from "./useLunsViewModel";

// TODO(jkilzi): Hard-coded for now, but must handle namespaces dynamically
const NAMESPACE = "ibm-spectrum-scale";

export const useCreateFileSystemHandler = (
  fileSystemName: string,
  luns: LunsViewModel
) => {
  const [, dispatch] = useStore<State, Actions>();

  const { t } = useFusionAccessTranslations();

  const redirectToFileSystemsHome = useRedirectHandler(
    "/fusion-access/file-systems"
  );

  const [localDiskModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "LocalDisk",
  });

  const [fileSystemModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "Filesystem",
  });

  const [storageClassModel] = useK8sModel({
    group: "storage.k8s.io",
    version: "v1",
    kind: "StorageClass",
  });

  return useCallback(async () => {
    if (!luns.nodeName) {
      dispatch({
        type: "global/addAlert",
        payload: {
          title: "Node name is required to create a file system.",
          variant: "warning",
          dismiss: () => dispatch({ type: "global/dismissAlert" }),
        },
      });
      return;
    }

    try {
      dispatch({
        type: "global/updateCta",
        payload: { isLoading: true },
      });

      const localDisks = await createLocalDisks(
        luns,
        localDiskModel,
        NAMESPACE
      );

      await createFileSystem(
        fileSystemName,
        localDisks,
        fileSystemModel,
        NAMESPACE
      );

      await createStorageClass(storageClassModel, fileSystemName);

      redirectToFileSystemsHome();
    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("An error occurred while creating resources"),
          description,
          variant: "danger",
        },
      });
    } finally {
      dispatch({
        type: "global/updateCta",
        payload: { isLoading: false },
      });
    }
  }, [
    dispatch,
    fileSystemModel,
    fileSystemName,
    localDiskModel,
    luns,
    redirectToFileSystemsHome,
    storageClassModel,
    t,
  ]);
};

function createFileSystem(
  fileSystemName: string,
  localDisks: LocalDisk[],
  fileSystemModel: K8sModel,
  namespace: string
): Promise<FileSystem> {
  return k8sCreate<FileSystem>({
    model: fileSystemModel,
    data: {
      apiVersion: "scale.spectrum.ibm.com/v1beta1",
      kind: "FileSystem",
      metadata: { name: fileSystemName, namespace },
      spec: {
        local: {
          pools: [
            {
              disks: Array.from(
                new Set(
                  localDisks.map((ld) => ld.metadata?.name).filter(Boolean)
                )
              ) as string[],
            },
          ],
          replication: "1-way",
          type: "shared",
        },
      },
    },
  });
}

function createLocalDisks(
  luns: LunsViewModel,
  localDiskModel: K8sModel,
  namespace: string
) {
  const promises: Promise<LocalDisk>[] = [];
  for (const lun of luns.data.filter(l => l.isSelected)) {
    const localDiskName =
      `${lun.path.slice("/dev/".length)}-${lun.wwn}`.replaceAll(".", "-");
    const promise = k8sCreate<LocalDisk>({
      model: localDiskModel,
      data: {
        apiVersion: "scale.spectrum.ibm.com/v1beta1",
        kind: "LocalDisk",
        metadata: { name: localDiskName, namespace },
        spec: {
          device: lun.path,
          node: luns.nodeName!,
        },
      },
    });
    promises.push(promise);
  }

  return Promise.all(promises);
}

const createStorageClass = (scModel: K8sModel, fileSystemName: string) => {
  return k8sCreate<StorageClass>({
    model: scModel,
    data: {
      apiVersion: `${scModel.apiGroup}/${scModel.apiVersion}`,
      kind: scModel.kind,
      metadata: { name: fileSystemName },
      provisioner: SC_PROVISIONER,
      parameters: {
        volBackendFs: fileSystemName,
      },
      reclaimPolicy: "Delete",
      allowVolumeExpansion: true,
      volumeBindingMode: "Immediate",
    },
  });
};
