import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { SPECTRUM_SCALE_NAMESPACE } from "@/constants";
import type { Daemon } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Daemon";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/daemon_gvk";

type Options = Omit<WatchK8sResource, "groupVersionKind" | "isList">;

export const useDaemonsRepository = (options: Options = {}) => {
  const result = useWatchDaemon(options);
  return useMemo(
    () => ({
      loaded: result.loaded,
      error: result.error,
      daemons: result.data ?? [],
    }),
    [result.loaded, result.error, result.data],
  );
};

const useWatchDaemon = (options: Options = {}) =>
  useNormalizedK8sWatchResource<Daemon>({
    ...options,
    isList: true,
    namespaced: true,
    namespace: SPECTRUM_SCALE_NAMESPACE,
    groupVersionKind,
  });
