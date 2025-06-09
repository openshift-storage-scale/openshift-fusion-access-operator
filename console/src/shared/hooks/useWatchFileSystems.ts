import {
  useK8sWatchResource,
  type WatchK8sResource,
} from "@openshift-console/dynamic-plugin-sdk";
import type { UseK8sWatchResourceWithInferedList } from "@/shared/utils/console/UseK8sWatchResource";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";

export const useWatchFileSystem: UseK8sWatchResourceWithInferedList<
  FileSystem,
  Omit<WatchK8sResource, "groupVersionKind">
> = (options) => {
  return useK8sWatchResource({
    ...options,
    namespaced: true,
    groupVersionKind: {
      group: "scale.spectrum.ibm.com",
      version: "v1beta1",
      kind: "Filesystem",
    },
  });
};
