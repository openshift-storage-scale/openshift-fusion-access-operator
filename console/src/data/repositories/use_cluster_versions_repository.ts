import type { WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import type { IoOpenshiftConfigV1ClusterVersion } from "@/shared/types/openshift/4.19/types";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/cluster_version_gvk";

type Options = Omit<WatchK8sResource, "groupVersionKind" | "isList">;

export const useClusterVersionsRepository = (options: Options = {}) => {
  const result = useWatchClusterVersion(options);
  return {
    loaded: result.loaded,
    error: result.error,
    clusterVersion: result.data,
  };
};

const useWatchClusterVersion = (options: Options = {}) =>
  useNormalizedK8sWatchResource<IoOpenshiftConfigV1ClusterVersion>({
    ...options,
    isList: false,
    groupVersionKind,
    name: options.name ?? "version",
  });
