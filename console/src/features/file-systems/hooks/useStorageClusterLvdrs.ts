import { useMemo } from "react";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import type { LocalVolumeDiscoveryResult } from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";
import { WORKER_NODE_ROLE_LABEL, STORAGE_ROLE_LABEL } from "@/constants";

export const useStorageClusterLvdrs = (): [
  LocalVolumeDiscoveryResult[],
  boolean,
  Error | null,
] => {
  const [lvdrs, lvdrsLoaded, lvdrsLoadError] =
    useWatchLocalVolumeDiscoveryResult();

  const [selectedNodes, selectedNodesLoaded, selectedNodesLoadError] =
    useWatchNode({
      withLabels: [WORKER_NODE_ROLE_LABEL, STORAGE_ROLE_LABEL],
    });

  const results = useMemo(
    () =>
      (lvdrs ?? []).filter((lvdr) =>
        (selectedNodes ?? []).find(
          (node) => node.metadata?.name === lvdr.spec.nodeName
        )
      ),
    [lvdrs, selectedNodes]
  );

  return [
    results,
    lvdrsLoaded && selectedNodesLoaded,
    lvdrsLoadError || selectedNodesLoadError,
  ];
};
