import { useCallback, useEffect, useMemo, useState } from "react";
import convert from "convert";

import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useStorageNodesLvdrs } from "./useStorageNodesLvdrs";
import { useWatchLocalDisk } from "@/shared/hooks/useWatchLocalDisk";
import { useWatchUnusedLocalDisks, type UnusedLocalDisk } from "@/shared/hooks/useWatchUnusedLocalDisks";

export interface Lun {
  path: string;
  wwn: string;
  capacity: string;
  isSelected: boolean;
  isReused?: boolean; // Mark if this is from unused LocalDisk
  localDiskName?: string; // For reused disks, store the LocalDisk name
}

export interface LunsViewModel {
  data: Lun[];
  loaded: boolean;
  nodeName?: string;
  isSelected: (lun: Lun) => boolean;
  setSelected: (lun: Lun, isSelected: boolean) => void;
  setAllSelected: (isSelected: boolean) => void;
}

// Utility function to format bytes to human readable format
const formatBytes = (bytes: number | string | undefined): string => {
  if (!bytes) return "Unknown";
  
  const numBytes = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (isNaN(numBytes)) return "Unknown";
  
  try {
    return convert(numBytes, "B").to("best", "imperial").toString(2);
  } catch (error) {
    // Fallback to simple GB conversion if convert fails
    const gb = numBytes / (1024 ** 3);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(numBytes / (1024 ** 2)).toFixed(1)} MB`;
  }
};

const toLun = (device: any): Lun => ({
  path: device.path,
  wwn: device.wwn || device.WWN, // Handle both lowercase and uppercase WWN
  capacity: formatBytes(device.capacity || device.size),
  isSelected: false,
  isReused: false,
});

const unusedLocalDiskToLun = (unusedDisk: UnusedLocalDisk): Lun => ({
  path: unusedDisk.device,
  wwn: unusedDisk.wwn || "Unknown",
  capacity: formatBytes(unusedDisk.capacity), 
  isSelected: false,
  isReused: true,
  localDiskName: unusedDisk.name,
});

const outDevicesUsedByLocalDisks = (localDisks: any[]) => (device: any) => {
  return !localDisks.some((ld) => ld.spec.device === device.path);
};

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
  const unusedLocalDisks = useWatchUnusedLocalDisks();

  const [luns, setLuns] = useState<Lun[]>([]);

  useEffect(() => {
    const discoveredDevices = storageNodesLvdr?.status?.discoveredDevices ?? [];
    const loaded = storageNodesLvdrs.loaded && localDisks.loaded && unusedLocalDisks.loaded;
    
    if (loaded) {
      const allLuns: Lun[] = [];
      
      try {
        // Add new devices from LVDR (not yet used by LocalDisks)
        if (discoveredDevices.length > 0) {
          const newDeviceLuns = discoveredDevices
            .filter(outDevicesUsedByLocalDisks(localDisks.data ?? []))
            .map(toLun)
            .filter(lun => lun.path && lun.wwn); // Only include valid LUNs
          allLuns.push(...newDeviceLuns);
        }
        
        // Add unused LocalDisks (previously created but not used by filesystems)
        if (unusedLocalDisks.data && unusedLocalDisks.data.length > 0) {
          const reusedLuns = unusedLocalDisks.data
            .map(unusedLocalDiskToLun)
            .filter(lun => lun.path && lun.localDiskName); // Only include valid reused LUNs
          allLuns.push(...reusedLuns);
        }
        
        // Use setTimeout to avoid state updates during render
        setTimeout(() => {
          setLuns(currentLuns => {
            // Preserve existing selection state
            const updatedLuns = allLuns.map(newLun => {
              const existingLun = currentLuns.find(existing => existing.path === newLun.path);
              return existingLun ? { ...newLun, isSelected: existingLun.isSelected } : newLun;
            });
            return updatedLuns;
          });
        }, 0);
      } catch (error) {
        console.error('LunsViewModel: Error processing LUNs:', error);
        setTimeout(() => {
          setLuns([]);
        }, 0);
      }
    }
  }, [
    localDisks.data,
    localDisks.loaded,
    storageNodesLvdr?.status?.discoveredDevices,
    storageNodesLvdrs.loaded,
    unusedLocalDisks.data,
    unusedLocalDisks.loaded,
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

  const setAllSelected = useCallback((isSelected: boolean) => {
    setLuns((current) => {
      const draft = window.structuredClone(current);
      draft.forEach((lun) => {
        lun.isSelected = isSelected;
      });
      return draft;
    });
  }, []);

  return {
    data: luns,
    loaded: storageNodesLvdrs.loaded && localDisks.loaded && unusedLocalDisks.loaded,
    nodeName: storageNodesLvdr?.spec?.nodeName,
    isSelected,
    setSelected,
    setAllSelected,
  };
};
