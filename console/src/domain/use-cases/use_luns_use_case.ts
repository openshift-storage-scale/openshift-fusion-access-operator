import type { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";
import convert from "convert";
import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_ROLE_LABEL, WORKER_NODE_ROLE_LABEL } from "@/constants";
import { useFileSystemClaimsRepository } from "@/data/repositories/use_file_system_claims_repository";
import { useLocalVolumeDiscoveryResultRepository } from "@/data/repositories/use_local_volume_discovery_result_respository";
import { useNodesRepository } from "@/data/repositories/use_nodes_repository";
import type { Lun } from "@/domain/models/lun";
import { useLocalizationService } from "@/domain/services/use_localization_service";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import type { LocalVolumeDiscoveryResult } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/LocalVolumeDiscoveryResult";
import type { NormalizedWatchK8sResult } from "@/shared/utils/use_k8s_watch_resource";

type DiscoveredDevice = NonNullable<
  NonNullable<LocalVolumeDiscoveryResult["status"]>["discoveredDevices"]
>[number];

export const useLunsUseCase = () => {
  const { t } = useLocalizationService();
  const [luns, setLuns] = useState<Lun[]>([]);
  const [, dispatch] = useStore<State, Actions>();
  const fileSystemClaimsRepository = useFileSystemClaimsRepository();
  const storageNodesLvdrs = useStorageNodesLvdrs();

  useEffect(() => {
    if (fileSystemClaimsRepository.error) {
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("Failed to load FileSystemClaims"),
          description: fileSystemClaimsRepository.error.message,
          variant: "danger",
          dismiss: () => dispatch({ type: "global/dismissAlert" }),
        },
      });
    } else {
      dispatch({ type: "global/dismissAlert" });
    }
  }, [dispatch, fileSystemClaimsRepository.error, t]);

  useEffect(() => {
    if (storageNodesLvdrs.error) {
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t(
            "Failed to load LocalVolumeDiscoveryResults for storage nodes",
          ),
          description: storageNodesLvdrs.error.message,
          variant: "danger",
          dismiss: () => dispatch({ type: "global/dismissAlert" }),
        },
      });
    } else {
      dispatch({ type: "global/dismissAlert" });
    }
  }, [dispatch, storageNodesLvdrs.error, t]);

  useEffect(() => {
    if (
      !fileSystemClaimsRepository.loaded ||
      fileSystemClaimsRepository.fileSystemClaims === null ||
      !storageNodesLvdrs.loaded ||
      storageNodesLvdrs.data === null
    ) {
      return;
    }

    const newLuns = makeLuns(
      storageNodesLvdrs.data,
      fileSystemClaimsRepository.fileSystemClaims,
    );

    setLuns((currentLuns) => {
      const currentlySelectedLunsWwns = new Set(
        currentLuns.filter((l) => l.isSelected).map((l) => l.wwn),
      );

      return newLuns.map((lun) => ({
        ...lun,
        isSelected: currentlySelectedLunsWwns.has(lun.wwn),
      }));
    });
  }, [
    fileSystemClaimsRepository.fileSystemClaims,
    fileSystemClaimsRepository.loaded,
    storageNodesLvdrs.data,
    storageNodesLvdrs.loaded,
  ]);

  const isSelected = useCallback(
    (lun: Lun) => luns.find((l) => l.wwn === lun.wwn)?.isSelected ?? false,
    [luns],
  );

  const setSelected = useCallback((lun: Lun, isSelected: boolean) => {
    setLuns((current) => {
      const draft = window.structuredClone(current);
      const subject = draft.find((l) => l.wwn === lun.wwn);
      if (subject) {
        subject.isSelected = isSelected;
        return draft;
      } else {
        return current;
      }
    });
  }, []);

  const setAllSelected = useCallback((isSelecting: boolean) => {
    setLuns((current) => {
      const draft = window.structuredClone(current);
      draft.forEach((lun) => {
        lun.isSelected = isSelecting;
      });

      return draft;
    });
  }, []);

  const data = luns;
  const loaded = storageNodesLvdrs.loaded && fileSystemClaimsRepository.loaded;

  return useMemo(
    () =>
      ({
        data,
        loaded,
        isSelected,
        setSelected,
        setAllSelected,
      }) as const,
    [data, isSelected, loaded, setAllSelected, setSelected],
  );
};

export type LunsRepository = ReturnType<typeof useLunsUseCase>;

export type WithNodeName<T> = T & { nodeName: string };

/**
 * Returns a predicate function to filter out discovered devices that are already used by any of the provided file system claims.
 *
 * The returned function is intended for use with Array.prototype.filter on discovered devices.
 * It returns true for a discovered device if:
 *   - The fileSystemClaims array is empty (i.e., no claims to check against), or
 *   - The device's WWN does NOT match any device WWN specified in any file system claim's spec.devices array.
 *
 * Note: This logic is used to exclude devices that are already associated with a file system claim, preventing
 * the same LUN from being selected for multiple claims (including those in provisioning status).
 *
 * @param fileSystemClaims - Array of FileSystemClaim objects to check for existing usage.
 * @returns A predicate function that takes a WithNodeName<DiscoveredDevice> and returns a boolean indicating if the device is not used.
 */
const outDevicesUsedByFileSystemClaims =
  (fileSystemClaims: FileSystemClaim[]) =>
  (dd: WithNodeName<DiscoveredDevice>): boolean => {
    const usedDeviceIds = new Set<string>();
    fileSystemClaims.forEach((claim) => {
      claim.spec?.devices?.forEach((deviceId) => {
        usedDeviceIds.add(deviceId);
      });
    });
    return !usedDeviceIds.has(dd.deviceID);
  };

/**
 * Transforms a discovered device entry (with nodeName) into a Lun object suitable to be displayed by the UI.
 *
 * @param entry - A tuple where the second element is an array containing a discovered device object
 *                 augmented with nodeName (i.e., [WWN, WithNodeName<DiscoveredDevice>[]]).
 * @returns A Lun object with:
 *   - isSelected: false by default,
 *   - nodeName: the node name from the discovered device,
 *   - path: the device path,
 *   - wwn: the device's WWN,
 *   - capacity: the device size formatted as a string in GiB (e.g., "10.00 GiB").
 */
const toLun = (dd: WithNodeName<DiscoveredDevice>): Lun => ({
  isSelected: false,
  nodeName: dd.nodeName,
  path: dd.path,
  wwn: dd.WWN,
  deviceId: dd.deviceID,
  capacity: convert(dd.size, "B").to("GiB").toFixed(2) + " GiB",
});

/**
 * Returns a function that takes a DiscoveredDevice and returns a new object
 * combining the device's properties with the nodeName from the given LocalVolumeDiscoveryResult.
 *
 * @param lvdr - The LocalVolumeDiscoveryResult containing the nodeName to attach.
 * @returns A function that takes a DiscoveredDevice and returns a WithNodeName<DiscoveredDevice>.
 */
const toDiscoveredDeviceWithNodeName =
  (lvdr: LocalVolumeDiscoveryResult) =>
  (dd: DiscoveredDevice): WithNodeName<DiscoveredDevice> => ({
    ...dd,
    nodeName: lvdr.spec?.nodeName ?? "",
  });

/**
 * Combines discovered devices from multiple LocalVolumeDiscoveryResult objects,
 * attaching the nodeName from each result to its discovered devices.
 *
 * @param storageNodesLvdrs - An array of LocalVolumeDiscoveryResult objects, each representing a node's discovered devices.
 * @returns An array of discovered devices, each augmented with the corresponding nodeName.
 */
const makeDiscoveredDevicesWithNodeName = (
  storageNodesLvdrs: LocalVolumeDiscoveryResult[],
): WithNodeName<DiscoveredDevice>[] =>
  storageNodesLvdrs.flatMap((lvdr) =>
    (lvdr.status?.discoveredDevices ?? []).map(
      toDiscoveredDeviceWithNodeName(lvdr),
    ),
  );

const makeLuns = (
  storageNodesLvdrs: LocalVolumeDiscoveryResult[],
  fileSystemClaims: FileSystemClaim[],
) => {
  const ddsSharedByAllStorageNodes =
    getSharedDiscoveredDevicesRepresentatives(storageNodesLvdrs);
  return ddsSharedByAllStorageNodes
    .filter(outDevicesUsedByFileSystemClaims(fileSystemClaims))
    .map(toLun);
};

/**
 * Returns a representative discovered device for each WWN that is present on all storage nodes.
 *
 * This function processes an array of LocalVolumeDiscoveryResult objects (one per storage node),
 * extracts all discovered devices (annotated with their nodeName), and groups them by their WWN.
 * It then filters to only include groups (WWNs) that are present on every storage node (i.e., the group size
 * matches the number of storage nodes). For each such group, it selects the first discovered device as the representative.
 *
 * @param storageNodesLvdrs - An array of LocalVolumeDiscoveryResult objects, each representing a storage node's discovered devices.
 * @returns An array of WithNodeName<DiscoveredDevice> objects, each representing a device (by WWN) that is shared by all storage nodes.
 */
const getSharedDiscoveredDevicesRepresentatives = (
  storageNodesLvdrs: LocalVolumeDiscoveryResult[],
) => {
  const discoveredDevicesWithNodeName =
    makeDiscoveredDevicesWithNodeName(storageNodesLvdrs);

  // Divide them into groups by WWN
  const groupedByWwns = Object.groupBy(
    discoveredDevicesWithNodeName,
    (dd) => dd.WWN,
  );

  // Filter out the groups that are not shared by all storage nodes
  const onlySharedByAllStorageNodes = Object.entries(groupedByWwns).filter(
    ([_, dds]) => Array.isArray(dds) && dds.length === storageNodesLvdrs.length,
  ) as [string, WithNodeName<DiscoveredDevice>[]][];

  // Pick a representative discovered device from each group
  return onlySharedByAllStorageNodes.map(([_, dds]) => dds[0]);
};

const useStorageNodesLvdrs = (): NormalizedWatchK8sResult<
  LocalVolumeDiscoveryResult[]
> => {
  const lvdrsRepository = useLocalVolumeDiscoveryResultRepository();
  const storageNodesRepository = useNodesRepository({
    withLabels: [WORKER_NODE_ROLE_LABEL, STORAGE_ROLE_LABEL],
  });
  const storageNodesLvdrs = useMemo(
    () =>
      lvdrsRepository.localVolumeDiscoveryResults.filter((lvdr) =>
        storageNodesRepository.nodes.find(
          (node) =>
            (node.metadata as K8sResourceCommon["metadata"])?.name ===
            lvdr.spec?.nodeName,
        ),
      ),
    [lvdrsRepository.localVolumeDiscoveryResults, storageNodesRepository.nodes],
  );

  return useMemo(
    () => ({
      data: storageNodesLvdrs,
      loaded: lvdrsRepository.loaded && storageNodesRepository.loaded,
      error: lvdrsRepository.error || storageNodesRepository.error,
    }),
    [
      lvdrsRepository.error,
      lvdrsRepository.loaded,
      storageNodesLvdrs,
      storageNodesRepository.error,
      storageNodesRepository.loaded,
    ],
  );
};
