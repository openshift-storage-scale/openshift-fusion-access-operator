import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";
import type { FusionAccess } from "../types/fusion-access/FusionAccess";

export const useWatchFusionAccess = (
  options: Omit<
    WatchK8sResource,
    "groupVersionKind" | "namespaced" | "namespace" | "limit" | "isList"
  > = {}
) =>
  useNormalizedK8sWatchResource<FusionAccess>({
    ...options,
    isList: false,
    namespaced: true,
    namespace: "ibm-fusion-access",
    groupVersionKind: {
      group: "fusion.storage.openshift.io",
      version: "v1alpha1",
      kind: "FusionAccess",
    },
  });
