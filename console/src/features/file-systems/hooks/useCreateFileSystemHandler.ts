import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import type {
  LocalVolumeDiscoveryResult,
  DiscoveredDevice,
} from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";
import {
  k8sCreate,
  useK8sModel,
  type K8sModel,
  type StorageClass,
} from "@openshift-console/dynamic-plugin-sdk";
import { useHistory } from "react-router";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useCallback } from "react";
import type { LocalDisk } from "@/shared/types/ibm-spectrum-scale/LocalDisk";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { SC_PROVISIONER } from "@/constants";

export const useCreateFileSystemHandler = (
  fileSystemName: string,
  discoveryResultsForStorageNodes: LocalVolumeDiscoveryResult[],
  selectedDevices: DiscoveredDevice[]
) => {
  const [, dispatch] = useStore<State, Actions>();
  const { t } = useFusionAccessTranslations();
  const history = useHistory();

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
    try {
      dispatch({
        type: "updateCtas",
        payload: { createFileSystem: { isLoading: true } },
      });

      // TODO(jkilzi): Hard-coded for now, but must handle namespaces dynamically
      const namespace = "ibm-spectrum-scale";

      const localDisks = await createLocalDisks(
        discoveryResultsForStorageNodes,
        selectedDevices,
        localDiskModel,
        namespace
      );

      await createFileSystem(
        localDisks,
        fileSystemModel,
        fileSystemName,
        namespace
      );

      await createStorageClass(storageClassModel, fileSystemName);

      history.push("/fusion-access/file-systems");
    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      dispatch({
        type: "showAlert",
        payload: {
          variant: "danger",
          title: t("An error occurred while creating resources"),
          description,
          isDismissable: true,
        },
      });
    } finally {
      dispatch({
        type: "updateCtas",
        payload: { createStorageCluster: { isLoading: false } },
      });
    }
  }, [
    discoveryResultsForStorageNodes,
    dispatch,
    fileSystemModel,
    fileSystemName,
    history,
    localDiskModel,
    selectedDevices,
    storageClassModel,
    t,
  ]);
};

function createFileSystem(
  localDisks: PromiseSettledResult<LocalDisk>[],
  fileSystemModel: K8sModel,
  fileSystemName: string,
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
                  localDisks
                    .filter((ld) => ld.status === "fulfilled")
                    .map((ld) => ld.value.metadata?.name)
                    .filter(Boolean)
                )
              ) as string[],
            },
          ],
          // TODO(jkilzi): Check these 2 props below are correct. Marked in TS as required fields.
          replication: "1-way",
          type: "shared",
        },
      },
    },
  });
}

function createLocalDisks(
  discoveryResultsForStorageNodes: LocalVolumeDiscoveryResult[],
  selectedDevices: DiscoveredDevice[],
  localDiskModel: K8sModel,
  namespace: string
) {
  const promises: Promise<LocalDisk>[] = [];
  for (const device of selectedDevices) {
    // find a node that contains this device
    const discoveryResult = discoveryResultsForStorageNodes.find((r) =>
      r.status?.discoveredDevices?.find((d) => d.WWN === device.WWN)
    );
    if (!discoveryResult) {
      throw new Error(
        "No storage node contains the selected LUN with WWN: " + device.WWN
      );
    }

    const localDiskName =
      `${device.path.slice("/dev/".length)}-${device.WWN}`.replaceAll(".", "-");
    const promise = k8sCreate<LocalDisk>({
      model: localDiskModel,
      data: {
        apiVersion: "scale.spectrum.ibm.com/v1beta1",
        kind: "LocalDisk",
        metadata: { name: localDiskName, namespace },
        spec: {
          existingDataSkipVerify: true, // TODO(jkilzi): REMOVE it! Destroys data with no warning.
          device: device.path,
          node: discoveryResult.spec.nodeName,
        },
      },
    });
    promises.push(promise);
  }

  return Promise.allSettled(promises);
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
