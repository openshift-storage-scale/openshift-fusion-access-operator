import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";

export const useWatchFileSystem = (
  options: Omit<
    WatchK8sResource,
    "groupVersionKind" | "namespaced" | "isList"
  > = {}
) =>
  useNormalizedK8sWatchResource<FileSystem>({
    ...options,
    isList: true,
    namespaced: true,
    groupVersionKind: {
      group: "scale.spectrum.ibm.com",
      version: "v1beta1",
      kind: "Filesystem",
    },
  });
