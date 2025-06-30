import convert from "convert";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useStorageNodesLvdrs } from "./useStorageNodesLvdrs";

export interface Lun {
  isSelected: boolean;
  name: string;
  id: string;
  capacity: string;
  wwn: string;
}

export const useLunsViewModel = () => {
  const { t } = useFusionAccessTranslations();

  const [, dispatch] = useStore<State, Actions>();

  const storageNodesLvdrs = useStorageNodesLvdrs();

  useEffect(() => {
    if (storageNodesLvdrs.error) {
      dispatch({
        type: "global/showAlert",
        payload: {
          title: t(
            "Failed to load LocaVolumeDiscoveryResults for storage nodes"
          ),
          description: storageNodesLvdrs.error.message,
          isDismissable: true,
          variant: "danger",
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageNodesLvdrs.error, t]);

  const discoveredDevices = useMemo(
    // We're taking just the first LVDR from the storage nodes because
    // all of them MUST report the same disks as required during storage
    // cluster creation
    () => storageNodesLvdrs.data?.[0]?.status?.discoveredDevices,
    [storageNodesLvdrs.data]
  );

  const [luns, setLuns] = useState<Lun[]>([]);

  useEffect(() => {
    if (storageNodesLvdrs.loaded && discoveredDevices) {
      setLuns(
        discoveredDevices.map((disk) => {
          return {
            isSelected: false,
            id: disk.WWN.slice("uuid.".length),
            name: disk.path,
            wwn: disk.WWN,
            // Note: Usage of 'GB' is intentional here
            capacity: convert(disk.size, "B").to("GiB").toFixed(2) + " GB",
          };
        })
      );
    }
  }, [discoveredDevices, storageNodesLvdrs.loaded]);

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
  const nodeName = storageNodesLvdrs.data?.[0]?.spec.nodeName;
  const loaded = storageNodesLvdrs.loaded && typeof nodeName === "string";

  const vm = useMemo(
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

  return vm;
};

export type LunsViewModel = ReturnType<typeof useLunsViewModel>;
