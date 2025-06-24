import { useCallback } from "react";
import { useHistory } from "react-router";

type WellKnownUrlPaths =
  | "/fusion-access"
  | "/fusion-access/storage-cluster"
  | "/fusion-access/storage-cluster/create"
  | "/fusion-access/file-systems"
  | "/fusion-access/file-systems/create";

/**
 * Custom React hook that returns a callback function to redirect the user to a specified URL path.
 *
 * @param urlPath - The target path to redirect to, specified as a value of `WellKnownUrlPaths`.
 * @returns A memoized callback function that, when invoked, navigates to the given `urlPath` using the history API.
 *
 * @example
 * const redirectToDashboard = useRedirectHandler('/dashboard');
 * // Later in an event handler:
 * redirectToDashboard();
 */
export const useRedirectHandler = (urlPath: WellKnownUrlPaths) => {
  const history = useHistory();

  return useCallback(() => {
    history.push(urlPath);
  }, [history, urlPath]);
};
