import {
  useK8sModel,
  type WatchK8sResource,
} from "@openshift-console/dynamic-plugin-sdk";
import { useCallback, useMemo } from "react";
import { IN_FLIGHT_SLEEP_MS, STORAGE_CLUSTER_NAME } from "@/constants";
import type { Cluster } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Cluster";
import { sleep } from "@/shared/utils/async";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/storage_cluster_gvk";
import { storageClustersService } from "../services/storage_clusters_service";

type Options = Omit<
  WatchK8sResource,
  "groupVersionKind" | "isList" | "namespace" | "namespaced" | "name" | "limit"
>;

export const useStorageClustersRepository = (options: Options = {}) => {
  const result = useWatchStorageCluster(options);
  const [model, inFlight] = useK8sModel(groupVersionKind);

  const create = useCallback(async () => {
    while (inFlight) {
      await sleep(IN_FLIGHT_SLEEP_MS);
    }

    return storageClustersService.create(model);
  }, [model, inFlight]);

  return useMemo(
    () => ({
      loaded: result.loaded,
      error: result.error,
      storageClusters: result.data ?? [],
      hasNotBeenCreated: Array.isArray(result.data) && result.data.length === 0,
      create,
    }),
    [result.loaded, result.error, result.data, create],
  );
};

const useWatchStorageCluster = (options: Options = {}) =>
  useNormalizedK8sWatchResource<Cluster>({
    ...options,
    groupVersionKind,
    isList: true,
    limit: 1,
    name: STORAGE_CLUSTER_NAME,
    namespaced: false,
  });
