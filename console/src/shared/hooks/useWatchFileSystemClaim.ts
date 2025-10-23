import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";

export const useWatchFusionAccess = (
  options: Omit<
    WatchK8sResource,
    "groupVersionKind" | "namespaced" | "namespace" | "limit" | "isList"
  > = {}
) =>
  useNormalizedK8sWatchResource<FileSystemClaim>({
    ...options,
    isList: false,
    namespaced: true,
    namespace: "ibm-fusion-access",
    groupVersionKind: {
      group: "fusion.storage.openshift.io",
      version: "v1alpha1",
      kind: "FileSystemClaim",
    },
  });
