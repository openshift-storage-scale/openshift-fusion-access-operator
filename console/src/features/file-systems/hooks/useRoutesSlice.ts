import { useMemo } from "react";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import {
  useNormalizedK8sWatchResource,
  type NormalizedWatchK8sResult,
} from "@/shared/utils/console/UseK8sWatchResource";
import type { Route } from "../types/Route";
import { VALUE_NOT_AVAILABLE } from "@/constants";

export const useRoutesSlice = (): NormalizedWatchK8sResult<Route[]> => {
  const storageClusters = useWatchSpectrumScaleCluster({ limit: 1 });

  // Currently, we support creation of a single StorageCluster.
  const storageClusterName =
    storageClusters.data?.[0]?.metadata?.name ?? VALUE_NOT_AVAILABLE;

  const routes = useNormalizedK8sWatchResource<Route>({
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
  });

  return useMemo(
    () => ({
      data: routes.data,
      loaded: routes.loaded && storageClusters.loaded,
      error: routes.error || storageClusters.error,
    }),
    [routes, storageClusters.error, storageClusters.loaded]
  );
};
