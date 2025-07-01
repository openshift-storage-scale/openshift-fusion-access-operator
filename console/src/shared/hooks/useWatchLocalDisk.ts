import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";
import type { LocalDisk } from "@/shared/types/ibm-spectrum-scale/LocalDisk";

export const useWatchLocalDisk = (
  options: Omit<
    WatchK8sResource,
    "groupVersionKind" | "namespaced" | "namespace" | "isList"
  > = {}
) =>
  useNormalizedK8sWatchResource<LocalDisk>({
    ...options,
    isList: true,
    namespaced: true,
    namespace: "ibm-spectrum-scale",
    groupVersionKind: {
      group: "scale.spectrum.ibm.com",
      version: "v1beta1",
      kind: "LocalDisk",
    },
  });
