import { useMemo } from "react";
import type { LocalVolumeDiscoveryResult } from "@/models/fusion-access/LocalVolumeDiscoveryResult";
import type {
  IoK8sApiCoreV1Node,
  IoK8sApimachineryPkgApiResourceQuantity,
} from "@/models/kubernetes/1.30/types";
import type { WatchedResourceState } from "@/utils/console/UseK8sWatchResource";
import { useNodeSelectionChangeHandler } from "./useNodeSelectionChangeHandler";
import {
  MINIMUM_AMOUNT_OF_MEMORY_GIB,
  VALUE_NOT_AVAILABLE,
  STORAGE_ROLE_LABEL,
} from "@/constants";
import { getName, getUid, hasLabel } from "@/utils/console/K8sResourceCommon";
import {
  getMemory,
  getRole,
  getCpu,
} from "@/utils/kubernetes/1.30/IoK8sApiCoreV1Node";
import { type Signal, signal } from "@preact/signals-react";

export const useNodesSelectionTableViewModel = (
  nodesWatchState: WatchedResourceState<IoK8sApiCoreV1Node[], string>,
  lvdrsWatchState: WatchedResourceState<LocalVolumeDiscoveryResult[], string>
) => {
  const [nodes, nodesLoaded, nodesLoadErrorMessage] = nodesWatchState;
  const [lvdrs, lvdrsLoaded, lvdrsLoadErrorMessage] = lvdrsWatchState;
  const handleNodeSelectionChange = useNodeSelectionChangeHandler(nodes);
  const tableRows = useMemo(
    () => nodes.map((node) => createNodesSelectionTableRowViewModel(node)),
    [nodes]
  );
  const selectedNodes = useMemo(
    () => tableRows.filter((n) => n.status$.value === "selected"),
    [tableRows]
  );
  const sharedDisks = useMemo(
    () =>
      lvdrs
        .filter((lvdr) =>
          selectedNodes.find((n) => n.name === lvdr.spec.nodeName)
        )
        .map((lvdr) => lvdr.status?.discoveredDevices ?? [])
        .reduce((acc: Set<string>, devices, index) => {
          const wwns = new Set(devices.map((d) => d.WWN));
          return index === 0 ? acc.union(wwns) : acc.intersection(wwns);
        }, new Set<string>()),
    [lvdrs, selectedNodes]
  );

  return useMemo(
    () => ({
      tableRows,
      selectedNodes,
      sharedDisks,
      isLoaded: nodesLoaded && lvdrsLoaded,
      loadError: nodesLoadErrorMessage || lvdrsLoadErrorMessage,
      handleNodeSelectionChange,
    }),
    [
      handleNodeSelectionChange,
      lvdrsLoadErrorMessage,
      lvdrsLoaded,
      nodesLoadErrorMessage,
      nodesLoaded,
      selectedNodes,
      sharedDisks,
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
  status$: Signal<"selected" | "selection-pending" | "unselected">;
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
    status$: signal<"selected" | "selection-pending" | "unselected">(
      hasLabel(node, STORAGE_ROLE_LABEL) ? "selected" : "unselected"
    ),
    warnings,
  };
};
