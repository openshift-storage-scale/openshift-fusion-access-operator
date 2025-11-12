import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { SPECTRUM_SCALE_NAMESPACE } from "@/constants";
import { groupVersionKind } from "@/data/models/file_system_claim_gvk";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";

export const useWatchFileSystemClaim = (
  options: Omit<
    WatchK8sResource,
    "groupVersionKind" | "namespaced" | "namespace" | "limit" | "isList"
  > = {},
) =>
  useNormalizedK8sWatchResource<FileSystemClaim>({
    ...options,
    isList: true,
    namespaced: true,
    namespace: SPECTRUM_SCALE_NAMESPACE, // TODO(jkilzi): Why they must be in this namespace instead of FUSION_ACCESS_NAMESPACE?
    groupVersionKind,
  });
