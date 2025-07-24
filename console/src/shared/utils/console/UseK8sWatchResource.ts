import {
  useK8sWatchResource,
  type K8sResourceCommon,
  type WatchK8sResource,
  type WatchK8sResult,
} from "@openshift-console/dynamic-plugin-sdk";

/**
 * A hook that wraps `useK8sWatchResource` and normalizes its return value.
 * It provides a consistent tuple format `[data, loaded, error]` where `data` is
 * either the resource or an array of resources, `loaded` is a boolean indicating
 * if the data has been loaded, and `error` is an Error object or null.
 *
 * @template R The type of the Kubernetes resource(s) being watched.
 */
export const useNormalizedK8sWatchResource: UseNormalizedK8sWatchResource = <
  R extends K8sResourceCommon,
>(
  options: WatchK8sResource
) => {
  const result = useK8sWatchResource<R | R[]>(options);
  return normalizeResult<R>(result);
};

interface WatchK8sResourceList extends WatchK8sResource {
  isList: true;
}

interface UseNormalizedK8sWatchResource {
  <R extends K8sResourceCommon>(
    options: WatchK8sResourceList
  ): NormalizedWatchK8sResult<R[]>;
  <R extends K8sResourceCommon>(
    options: WatchK8sResource & { isList?: boolean }
  ): NormalizedWatchK8sResult<R>;
}

/**
 * Represents the normalized return value of the `useK8sWatchResource` hook.
 * It provides a consistent structure for handling loading, data, and error states.
 *
 * Possible outcomes are:
 * ```
 * [null, false, null]
 * [null, true, Error]
 * [R, true, null]
 * [R[], true, null]
 * ```
 */
export interface NormalizedWatchK8sResult<
  R extends K8sResourceCommon | K8sResourceCommon[],
> {
  data: R | null;
  loaded: boolean;
  error: Error | null;
}

const normalizeResult = <R extends K8sResourceCommon>(
  state: WatchK8sResult<R | R[]>
): NormalizedWatchK8sResult<R | R[]> => {
  const [data, loaded, error] = state;

  if (!loaded) {
    return {
      data: null,
      loaded: false,
      error: null,
    };
  }

  if (!data && !error) {
    return {
      data: null,
      loaded: true,
      error: new Error("The requested resource is not available"),
    };
  }

  if (error instanceof Error) {
    return { data: null, loaded: true, error };
  }

  if (typeof error === "string" && error.length > 0) {
    return { data: null, loaded: true, error: new Error(error) };
  }

  if (typeof error === "object") {
    const cause = JSON.stringify(error);
    return {
      data: null,
      loaded: true,
      error: new Error("Unknown error type", { cause }),
    };
  }

  return { data, loaded: true, error: null };
};
