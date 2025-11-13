import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { FUSION_ACCESS_NAMESPACE } from "@/constants";
import type { FusionAccess } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FusionAccess";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/fusion_access_gvk";

type Options = Omit<
  WatchK8sResource,
  "groupVersionKind" | "namespaced" | "namespace" | "limit" | "isList"
>;

export const useFusionAccessesRepository = (options: Options = {}) => {
  const result = useWatchFusionAccess(options);

  return useMemo(
    () => ({
      loaded: result.loaded,
      error: result.error,
      fusionAccess: result.data?.length ? result.data[0] : null,
      isReady:
        Array.isArray(result.data) &&
        result.data.length > 0 &&
        result.data[0]?.status?.status === "Ready",
    }),
    [result.loaded, result.error, result.data],
  );
};

const useWatchFusionAccess = (options: Options = {}) =>
  useNormalizedK8sWatchResource<FusionAccess>({
    ...options,
    isList: true,
    limit: 1,
    namespaced: true,
    namespace: FUSION_ACCESS_NAMESPACE,
    groupVersionKind,
  });
