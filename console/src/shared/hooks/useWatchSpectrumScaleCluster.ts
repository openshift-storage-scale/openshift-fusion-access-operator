import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";
import type { Cluster } from "@/shared/types/ibm-spectrum-scale/Cluster";

export const useWatchSpectrumScaleCluster = (
  options: Omit<WatchK8sResource, "groupVersionKind" | "isList"> = {}
) =>
  useNormalizedK8sWatchResource<Cluster>({
    ...options,
    isList: true,
    groupVersionKind: {
      group: "scale.spectrum.ibm.com",
      version: "v1beta1",
      kind: "Cluster",
    },
  });
