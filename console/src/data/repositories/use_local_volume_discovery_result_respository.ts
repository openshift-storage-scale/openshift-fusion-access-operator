import type { WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { FUSION_ACCESS_NAMESPACE } from "@/constants";
import type { LocalVolumeDiscoveryResult } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/LocalVolumeDiscoveryResult";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/lvdr_gvk";

export const useLocalVolumeDiscoveryResultRepository = (
  options: Omit<WatchK8sResource, "groupVersionKind" | "isList"> = {},
) => {
  const result = useWatchLocalVolumeDiscoveryResult(options);

  return {
    loaded: result.loaded,
    error: result.error,
    localVolumeDiscoveryResults: result.data ?? [],
  };
};

const useWatchLocalVolumeDiscoveryResult = (
  options: Omit<
    WatchK8sResource,
    "groupVersionKind" | "isList" | "namespaced" | "namespace"
  > = {},
) =>
  useNormalizedK8sWatchResource<LocalVolumeDiscoveryResult>({
    ...options,
    isList: true,
    namespaced: true,
    namespace: FUSION_ACCESS_NAMESPACE,
    groupVersionKind,
  });
