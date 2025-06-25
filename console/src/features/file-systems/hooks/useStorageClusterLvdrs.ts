import { useMemo } from "react";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import type { LocalVolumeDiscoveryResult } from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";
import { WORKER_NODE_ROLE_LABEL, STORAGE_ROLE_LABEL } from "@/constants";
import type { NormalizedWatchK8sResult } from "@/shared/utils/console/UseK8sWatchResource";

export const useStorageClusterLvdrs = (): NormalizedWatchK8sResult<
  LocalVolumeDiscoveryResult[]
> => {
  const lvdrs = useWatchLocalVolumeDiscoveryResult();

  const selectedNodes = useWatchNode({
    withLabels: [WORKER_NODE_ROLE_LABEL, STORAGE_ROLE_LABEL],
  });

  const results = useMemo(
    () =>
      (lvdrs.data ?? []).filter((lvdr) =>
        (selectedNodes.data ?? []).find(
          (node) => node.metadata?.name === lvdr.spec.nodeName
        )
      ),
    [lvdrs, selectedNodes]
  );

  return useMemo(
    () => ({
      data: results,
      loaded: lvdrs.loaded && selectedNodes.loaded,
      error: lvdrs.error || selectedNodes.error,
    }),
    [
      lvdrs.error,
      lvdrs.loaded,
      results,
      selectedNodes.error,
      selectedNodes.loaded,
    ]
  );
};
