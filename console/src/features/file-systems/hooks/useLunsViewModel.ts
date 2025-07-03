import convert from "convert";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useStorageNodesLvdrs } from "./useStorageNodesLvdrs";
import { useWatchLocalDisk } from "@/shared/hooks/useWatchLocalDisk";
import type { DiscoveredDevice } from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";
import type { LocalDisk } from "@/shared/types/ibm-spectrum-scale/LocalDisk";

export interface Lun {
  isSelected: boolean;
  id: string;
  name: string;
  capacity: string;
}

export const useLunsViewModel = () => {
  const { t } = useFusionAccessTranslations();

  const [, dispatch] = useStore<State, Actions>();

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
        },
      });
    }
  }, [dispatch, storageNodesLvdrs.error, t]);

  // We're taking just the first LVDR from the storage nodes because
  // all of them MUST report the same disks as required during storage
  // cluster creation
  const [storageNodesLvdr] = useMemo(
    () => storageNodesLvdrs.data ?? [],
    [storageNodesLvdrs.data]
  );

  const localDisks = useWatchLocalDisk();

  const [luns, setLuns] = useState<Lun[]>([]);

  useEffect(() => {
    const discoveredDevices = storageNodesLvdr?.status?.discoveredDevices ?? [];
    if (
      storageNodesLvdrs.loaded &&
      localDisks.loaded &&
      discoveredDevices.length
    ) {
      setLuns(
        discoveredDevices
          .filter(outDevicesUsedByLocalDisks(localDisks.data ?? []))
          .map(toLun)
      );
    }
  }, [
    localDisks.data,
    localDisks.loaded,
    storageNodesLvdr?.status?.discoveredDevices,
    storageNodesLvdrs.loaded,
  ]);

  const isSelected = useCallback(
    (lun: Lun) => luns.find((l) => l.id === lun.id)?.isSelected ?? false,
    [luns]
  );

  const setSelected = useCallback((lun: Lun, isSelected: boolean) => {
    setLuns((current) => {
      const draft = window.structuredClone(current);
      const subject = draft.find((l) => l.id === lun.id);
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
  const nodeName = storageNodesLvdr?.spec.nodeName;
  const loaded = storageNodesLvdrs.loaded && typeof nodeName === "string";

  return useMemo(
    () =>
      ({
        data,
        loaded,
        nodeName,
        isSelected,
        setSelected,
        setAllSelected,
      }) as const,
    [data, isSelected, loaded, nodeName, setAllSelected, setSelected]
  );
};

export type LunsViewModel = ReturnType<typeof useLunsViewModel>;

const outDevicesUsedByLocalDisks =
  (localDisks: LocalDisk[]) => (disk: DiscoveredDevice) =>
    localDisks.length
      ? localDisks.find(
          (localDisk) =>
            !localDisk.metadata?.name?.endsWith(disk.WWN.slice("uuid.".length))
        )
      : true;

const toLun = (disk: DiscoveredDevice): Lun => {
  return {
    isSelected: false,
    id: disk.path,
    name: disk.WWN.slice("uuid.".length),
    // Note: Usage of 'GB' is intentional here
    capacity: convert(disk.size, "B").to("GiB").toFixed(2) + " GB",
  };
};
