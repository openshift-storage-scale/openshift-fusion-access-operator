import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import type { ViewModelSlice } from "@/internal/types/ViewModelSlice";
import { useK8sWatchResource } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import type { Route } from "../types/Route";
import type { LoadableResourceState } from "@/internal/types/LoadableResource";

export const useRoutesSlice = (): ViewModelSlice<
  LoadableResourceState<Route[]>
> => {
  const [storageClusters, storageClustersLoaded, storageClassesLoadedError] =
    useWatchSpectrumScaleCluster({ limit: 1 });

  // Currently, we support creation of a single StorageCluster.
  const storageClusterName = storageClusters?.[0]?.metadata?.name;

  const [routes, routesLoaded, routesLoadedError] = useK8sWatchResource<
    Route[]
  >(
    storageClusterName
      ? {
          groupVersionKind: {
            group: "route.openshift.io",
            version: "v1",
            kind: "Route",
          },
          isList: true,
          selector: {
            matchLabels: {
              "app.kubernetes.io/instance": storageClusterName,
              "app.kubernetes.io/name": "gui",
            },
          },
        }
      : null
  );

  return useMemo(
    () => ({
      state: {
        data: routes,
        loaded: routesLoaded && storageClustersLoaded,
        error: routesLoadedError || storageClassesLoadedError,
      },
    }),
    [
      routes,
      routesLoaded,
      routesLoadedError,
      storageClassesLoadedError,
      storageClustersLoaded,
    ]
  );
};
