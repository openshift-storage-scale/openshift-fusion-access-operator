import convert from "convert";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useStorageNodesLvdrs } from "./useStorageNodesLvdrs";
import { useWatchLocalDisk } from "@/shared/hooks/useWatchLocalDisk";
import type {
  LocalVolumeDiscoveryResult,
} from "@/shared/types/fusion-storage-openshift-io/v1alpha1/LocalVolumeDiscoveryResult";
import type { LocalDisk } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/LocalDisk";
import type { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";

type DiscoveredDevice = NonNullable<NonNullable<LocalVolumeDiscoveryResult['status']>['discoveredDevices']>[number];

export const useLunsViewModel = () => {
  const { t } = useFusionAccessTranslations();

  const [luns, setLuns] = useState<Lun[]>([]);

  const [, dispatch] = useStore<State, Actions>();

  const localDisks = useWatchLocalDisk();

  useEffect(() => {
    if (localDisks.error) {
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("Failed to load LocalDisks"),
          description: localDisks.error.message,
          variant: "danger",
          dismiss: () => dispatch({ type: "global/dismissAlert" }),
        },
      });
    } else {
      // TODO: Handle auto-dismiss when error is gone.
    }
  }, [dispatch, localDisks.error, t]);

  const storageNodesLvdrs = useStorageNodesLvdrs();

  useEffect(() => {
    if (storageNodesLvdrs.error) {
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t(
            "Failed to load LocaVolumeDiscoveryResults for storage nodes"
          ),
          description: storageNodesLvdrs.error.message,
          variant: "danger",
          dismiss: () => dispatch({ type: "global/dismissAlert" }),
        },
      });
    } else {
      // TODO: Handle auto-dismiss when error is gone.
    }
  }, [dispatch, storageNodesLvdrs.error, t]);

  useEffect(() => {
    if (
      !localDisks.loaded ||
      localDisks.data === null ||
      !storageNodesLvdrs.loaded ||
      storageNodesLvdrs.data === null
    ) {
      return;
    }

    const newLuns = makeLuns(storageNodesLvdrs.data, localDisks.data);

    setLuns((currentLuns) => {
      const currentlySelectedLunsWwns = new Set(
        currentLuns.filter((l) => l.isSelected).map((l) => l.wwn)
      );

      return newLuns.map((lun) => ({
        ...lun,
        isSelected: currentlySelectedLunsWwns.has(lun.wwn),
      }));
    });
  }, [
    localDisks.data,
    localDisks.loaded,
    storageNodesLvdrs.data,
    storageNodesLvdrs.loaded,
  ]);

  const isSelected = useCallback(
    (lun: Lun) => luns.find((l) => l.path === lun.path)?.isSelected ?? false,
    [luns]
  );

  const setSelected = useCallback((lun: Lun, isSelected: boolean) => {
    setLuns((current) => {
      const draft = window.structuredClone(current);
      const subject = draft.find((l) => l.path === lun.path);
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
  const loaded = storageNodesLvdrs.loaded && localDisks.loaded;

  return useMemo(
    () =>
      ({
        data,
        loaded,
        isSelected,
        setSelected,
        setAllSelected,
      }) as const,
    [data, isSelected, loaded, setAllSelected, setSelected]
  );
};

export type LunsViewModel = ReturnType<typeof useLunsViewModel>;

export type WithNodeName<T> = T & { nodeName: string };

export interface Lun {
  isSelected: boolean;
  nodeName: string;
  path: string;
  wwn: string;
  /**
   * The capacity of the LUN, expressed as a string in GiB units.
   * Note: The value is obtained by calling lsblk, which returns sizes in GiB by default.
   */
  capacity: string;
}

/**
 * Returns a predicate function to filter out discovered devices that are already used by any of the provided local disks.
 *
 * The returned function is intended for use with Array.prototype.filter on entries of discovered devices grouped by WWN.
 * It returns true for a discovered device if:
 *   - The localDisks array is empty (i.e., no disks to check against), or
 *   - There is at least one local disk whose metadata.name does NOT match the device's WWN.
 *
 * Note: This logic is used to exclude devices that are already associated with a local disk, based on a suffix match of the WWN.
 *
 * @param localDisks - Array of LocalDisk objects to check for existing usage.
 * @returns A predicate function that takes a tuple [WWN, WithNodeName<DiscoveredDevice>[]] and returns a boolean indicating if the device is not used.
 */
const outDevicesUsedByLocalDisks =
  (localDisks: LocalDisk[]) =>
  (dd: WithNodeName<DiscoveredDevice>): boolean =>
    !localDisks.some((localDisk) => (localDisk.metadata as K8sResourceCommon['metadata'])?.name === dd.WWN);

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
  storageNodesLvdrs: LocalVolumeDiscoveryResult[]
): WithNodeName<DiscoveredDevice>[] =>
  storageNodesLvdrs.flatMap((lvdr) =>
    (lvdr.status?.discoveredDevices ?? []).map(
      toDiscoveredDeviceWithNodeName(lvdr)
    )
  );

const makeLuns = (
  storageNodesLvdrs: LocalVolumeDiscoveryResult[],
  localDisks: LocalDisk[]
) => {
  const ddsSharedByAllStorageNodes =
    getSharedDiscoveredDevicesRepresentatives(storageNodesLvdrs);
  return ddsSharedByAllStorageNodes
    .filter(outDevicesUsedByLocalDisks(localDisks))
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
  storageNodesLvdrs: LocalVolumeDiscoveryResult[]
) => {
  const discoveredDevicesWithNodeName =
    makeDiscoveredDevicesWithNodeName(storageNodesLvdrs);

  // Divide them into groups by WWN
  const groupedByWwns = Object.groupBy(
    discoveredDevicesWithNodeName,
    (dd) => dd.WWN
  );

  // Filter out the groups that are not shared by all storage nodes
  const onlySharedByAllStorageNodes = Object.entries(groupedByWwns).filter(
    ([_, dds]) => Array.isArray(dds) && dds.length === storageNodesLvdrs.length
  ) as [string, WithNodeName<DiscoveredDevice>[]][];

  // Pick a representative discovered device from each group
  return onlySharedByAllStorageNodes.map(([_, dds]) => dds[0]);
};
