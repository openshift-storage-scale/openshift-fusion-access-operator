import type { WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import type { Route } from "@/domain/models/routes";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/route_gvk";

export const useRoutesRepository = (
  options: Omit<WatchK8sResource, "groupVersionKind" | "isList"> = {},
) => {
  const result = useWatchRoutes(options);
  return {
    loaded: result.loaded,
    error: result.error,
    routes: result.data ?? [],
  };
};

const useWatchRoutes = (
  options: Omit<WatchK8sResource, "groupVersionKind" | "isList"> = {},
) =>
  useNormalizedK8sWatchResource<Route>({
    ...options,
    isList: true,
    groupVersionKind,
  });
