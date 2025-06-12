import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";
import type { LocalVolumeDiscoveryResult } from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";

export const useWatchLocalVolumeDiscoveryResult = (
  options: Omit<WatchK8sResource, "groupVersionKind" | "isList"> = {}
) =>
  useNormalizedK8sWatchResource<LocalVolumeDiscoveryResult>({
    ...options,
    isList: true,
    groupVersionKind: {
      group: "fusion.storage.openshift.io",
      version: "v1alpha1",
      kind: "LocalVolumeDiscoveryResult",
    },
  });
