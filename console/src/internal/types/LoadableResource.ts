import type { NormalizedWatchK8sResult } from "@/shared/utils/console/UseK8sWatchResource";
import type {
  K8sResourceCommon,
  WatchK8sResult,
} from "@openshift-console/dynamic-plugin-sdk";

export interface LoadableResourceState<D> {
  data: D | null | undefined;
  loaded: boolean;
  error: Error | string | null | undefined;
}

export const newLoadableResourceState = <
  D extends K8sResourceCommon | K8sResourceCommon[],
>([d, l, e]:
  | WatchK8sResult<D>
  | NormalizedWatchK8sResult<D>): LoadableResourceState<D> => ({
  data: d,
  loaded: l,
  error: e,
});
