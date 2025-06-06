import type {
  K8sResourceCommon,
  WatchK8sResource,
} from "@openshift-console/dynamic-plugin-sdk";

export type WatchedResourceState<R, E> = [R, boolean, E];

interface ListableWatchK8sResource extends WatchK8sResource {
  isList: true;
}

interface NonListableWatchK8sResource extends WatchK8sResource {
  isList?: false;
}

/**
 * This is an enhanced version of `UseK8sWatchResource` hook type that infers
 * the type of the resource based on the `isList` property and allows specifing
 * the Error type.
 *
 * The resource type will be inferred as an array when `isList` is true.
 */
export interface UseK8sWatchResourceWithInferedList<
  R extends K8sResourceCommon,
  O extends WatchK8sResource,
  E extends Error | string | undefined = string,
> {
  (options: ListableWatchK8sResource & O): WatchedResourceState<R[], E>;
  (options: NonListableWatchK8sResource & O): WatchedResourceState<R, E>;
}
