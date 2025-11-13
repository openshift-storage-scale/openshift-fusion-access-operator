import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { SPECTRUM_SCALE_NAMESPACE } from "@/constants";
import type { LocalDisk } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/LocalDisk";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/local_disk_gvk";

export const useLocalDisksRepository = (
  options: Omit<WatchK8sResource, "groupVersionKind" | "isList"> = {},
) => {
  const result = useWatchLocalDisk(options);
  return {
    loaded: result.loaded,
    error: result.error,
    localDisks: result.data ?? [],
  };
};

const useWatchLocalDisk = (
  options: Omit<
    WatchK8sResource,
    "groupVersionKind" | "namespaced" | "namespace" | "isList"
  > = {},
) =>
  useNormalizedK8sWatchResource<LocalDisk>({
    ...options,
    isList: true,
    namespaced: true,
    namespace: SPECTRUM_SCALE_NAMESPACE,
    groupVersionKind,
  });
