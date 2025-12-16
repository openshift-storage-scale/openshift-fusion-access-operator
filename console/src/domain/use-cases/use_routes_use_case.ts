import type { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { VALUE_NOT_AVAILABLE } from "@/constants";
import { useRoutesRepository } from "@/data/repositories/use_routes_repository";
import { useStorageClustersRepository } from "@/data/repositories/use_storage_clusters_repository";
import { getName } from "@/shared/utils/k8s_resource_common";

export const useRoutesUseCase = () => {
  const storageClustersRepository = useStorageClustersRepository();

  // Currently, we support creation of a single StorageCluster.
  const [storageCluster] = storageClustersRepository.storageClusters;
  const storageClusterName = getName(storageCluster) ?? VALUE_NOT_AVAILABLE;

  const routesRepository = useRoutesRepository({
    selector: {
      matchLabels: {
        "app.kubernetes.io/instance": storageClusterName,
        "app.kubernetes.io/name": "gui",
      },
    },
  });

  return useMemo(
    () => ({
      routes: routesRepository.routes,
      loaded: routesRepository.loaded && storageClustersRepository.loaded,
      error: routesRepository.error || storageClustersRepository.error,
    }),
    [
      routesRepository.routes,
      routesRepository.error,
      routesRepository.loaded,
      storageClustersRepository.error,
      storageClustersRepository.loaded,
    ],
  );
};
