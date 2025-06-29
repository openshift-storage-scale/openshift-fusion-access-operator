import { useMemo } from "react";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import type { LocalVolumeDiscoveryResult } from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";
import { WORKER_NODE_ROLE_LABEL, STORAGE_ROLE_LABEL } from "@/constants";
import type { NormalizedWatchK8sResult } from "@/shared/utils/console/UseK8sWatchResource";

export const useStorageNodesLvdrs = (): NormalizedWatchK8sResult<
  LocalVolumeDiscoveryResult[]
> => {
  const lvdrs = useWatchLocalVolumeDiscoveryResult();

  const storageNodes = useWatchNode({
    withLabels: [WORKER_NODE_ROLE_LABEL, STORAGE_ROLE_LABEL],
  });

  const storageNodesLvdrs = useMemo(
    () =>
      (lvdrs.data ?? []).filter((lvdr) =>
        (storageNodes.data ?? []).find(
          (node) => node.metadata?.name === lvdr.spec.nodeName
        )
      ),
    [lvdrs, storageNodes]
  );

  return useMemo(
    () => ({
      data: storageNodesLvdrs,
      loaded: lvdrs.loaded && storageNodes.loaded,
      error: lvdrs.error || storageNodes.error,
    }),
    [
      lvdrs.error,
      lvdrs.loaded,
      storageNodesLvdrs,
      storageNodes.error,
      storageNodes.loaded,
    ]
  );
};
