import type { WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import type { Filesystem } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Filesystem";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/file_system_gvk";

type Options = Omit<
  WatchK8sResource,
  "groupVersionKind" | "isList" | "namespaced"
>;

export const useFileSystemsRepository = (options: Options = {}) => {
  const result = useWatchFileSystems(options);
  return {
    loaded: result.loaded,
    error: result.error,
    fileSystems: result.data ?? [],
  };
};

const useWatchFileSystems = (options: Options = {}) => {
  return useNormalizedK8sWatchResource<Filesystem>({
    isList: true,
    ...options,
    namespaced: true,
    groupVersionKind,
  });
};
