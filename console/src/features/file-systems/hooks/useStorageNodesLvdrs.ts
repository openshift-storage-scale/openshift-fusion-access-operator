import type { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { STORAGE_ROLE_LABEL, WORKER_NODE_ROLE_LABEL } from "@/constants";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import type { LocalVolumeDiscoveryResult } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/LocalVolumeDiscoveryResult";
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
          (node) =>
            (node.metadata as K8sResourceCommon["metadata"])?.name ===
            lvdr.spec?.nodeName,
        ),
      ),
    [lvdrs.data, storageNodes.data],
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
    ],
  );
};
