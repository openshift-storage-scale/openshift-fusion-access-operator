import { useCallback, useEffect, useMemo, useState } from "react";
import type { LocalVolumeDiscoveryResult } from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";
import type {
  IoK8sApiCoreV1Node,
  IoK8sApimachineryPkgApiResourceQuantity,
} from "@/shared/types/kubernetes/1.30/types";
import type { NormalizedWatchK8sResult } from "@/shared/utils/console/UseK8sWatchResource";
import {
  MINIMUM_AMOUNT_OF_MEMORY_GIB,
  VALUE_NOT_AVAILABLE,
  STORAGE_ROLE_LABEL,
} from "@/constants";
import {
  getName,
  getUid,
  hasLabel,
} from "@/shared/utils/console/K8sResourceCommon";
import {
  getMemory,
  getRole,
  getCpu,
} from "@/shared/utils/kubernetes/1.30/IoK8sApiCoreV1Node";
import { t } from "@/shared/hooks/useFusionAccessTranslations";

export interface NodesSelectionTableViewModel {
  isLoaded: boolean;
  loadError: string | null;
  selectedNodes: NodesSelectionTableRowViewModel[];
  sharedDisksCount: number;
  sharedDisksCounterMessage: string;
  tableRows: NodesSelectionTableRowViewModel[];
  setNodeStatus: (
    node: NodesSelectionTableRowViewModel,
    status: NodesSelectionTableRowViewModel["status"]
  ) => void;
}

export const useNodesSelectionTableViewModel = (
  [nodes, nodesLoaded, nodesLoadError]: NormalizedWatchK8sResult<
    IoK8sApiCoreV1Node[]
  >,
  [lvdrs, lvdrsLoaded, lvdrsLoadError]: NormalizedWatchK8sResult<
    LocalVolumeDiscoveryResult[]
  >
): NodesSelectionTableViewModel => {
  const [tableRows, setTableRows] = useState<NodesSelectionTableRowViewModel[]>(
    []
  );

  const isLoaded = useMemo(
    () => nodesLoaded && lvdrsLoaded,
    [lvdrsLoaded, nodesLoaded]
  );

  const loadError = useMemo(
    () =>
      (nodesLoadError instanceof Error
        ? nodesLoadError.message
        : nodesLoadError) ||
      (lvdrsLoadError instanceof Error
        ? lvdrsLoadError.message
        : lvdrsLoadError),
    [lvdrsLoadError, nodesLoadError]
  );

  const selectedNodes = useMemo(
    () => tableRows.filter((n) => n.status === "selected"),
    [tableRows]
  );

  const sharedDisksCount = useMemo(() => {
    const wwnSetsList = (lvdrs ?? [])
      .filter((lvdr) =>
        selectedNodes.find((n) => n.name === lvdr.spec.nodeName)
      )
      .map((lvdr) => lvdr?.status?.discoveredDevices ?? [])
      .map((dd) => new Set(dd.map((d) => d.WWN)));

    return wwnSetsList.length >= 2
      ? wwnSetsList.reduce((previous, current) =>
          previous.intersection(current)
        ).size
      : new Set<string>().size;
  }, [lvdrs, selectedNodes]);

  const sharedDisksCounterMessage = useMemo(() => {
    const n = selectedNodes.length;
    const s = sharedDisksCount;
    switch (true) {
      case n === 0:
        return t("No nodes selected");
      case n === 1:
        return t("{{n}} node selected", { n });
      case n >= 2 && s === 1:
        return t("{{n}} nodes selected with {{s}} shared disk", { n, s });
      default:
        // n >= 2 && s >= 2
        return t("{{n}} nodes selected with {{s}} shared disks", { n, s });
    }
  }, [selectedNodes.length, sharedDisksCount]);

  const setNodeStatus = useCallback((node, status) => {
    setTableRows((currentState) => {
      const subjectIndex = currentState.findIndex((n) => n.uid === node.uid);
      if (subjectIndex === -1) {
        return currentState;
      }
      const draftState = structuredClone(currentState);
      draftState[subjectIndex].status = status;
      return draftState;
    });
  }, []);

  useEffect(() => {
    setTableRows(
      (nodes ?? []).map((node) => createNodesSelectionTableRowViewModel(node))
    );
  }, [nodes]);

  return useMemo(
    () => ({
      isLoaded,
      loadError,
      selectedNodes,
      setNodeStatus,
      sharedDisksCount,
      sharedDisksCounterMessage,
      tableRows,
    }),
    [
      isLoaded,
      loadError,
      selectedNodes,
      setNodeStatus,
      sharedDisksCount,
      sharedDisksCounterMessage,
      tableRows,
    ]
  );
};

export interface NodesSelectionTableRowViewModel {
  uid: string | undefined;
  name: string | undefined;
  role: string | undefined;
  cpu: IoK8sApimachineryPkgApiResourceQuantity | undefined;
  memory: string;
  status: "selected" | "selection-pending" | "unselected";
  warnings: Set<"InsufficientMemory">;
}

export const createNodesSelectionTableRowViewModel = (
  node: IoK8sApiCoreV1Node
): NodesSelectionTableRowViewModel => {
  const name = getName(node);
  const memory = getMemory(node);
  const warnings = new Set<"InsufficientMemory">();

  if (
    !(memory instanceof Error) &&
    memory.to("GiB") < MINIMUM_AMOUNT_OF_MEMORY_GIB
  ) {
    warnings.add("InsufficientMemory");
  }

  return {
    uid: getUid(node),
    name,
    role: getRole(node),
    cpu: getCpu(node),
    memory:
      memory instanceof Error
        ? VALUE_NOT_AVAILABLE
        : memory.to("best", "imperial").toString(2),
    status: hasLabel(node, STORAGE_ROLE_LABEL) ? "selected" : "unselected",
    warnings,
  };
};
