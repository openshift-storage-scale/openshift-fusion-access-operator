import { useCallback } from "react";
import { useHistory } from "react-router";

export const UrlPaths = {
  FusionAccessHome: "/fusion-access",
  StorageClusterHome: "/fusion-access/storage-cluster",
  StorageClusterCreate: "/fusion-access/storage-cluster/create",
  FileSystemsHome: "/fusion-access/file-systems",
  FileSystemsCreate: "/fusion-access/file-systems/create",
} as const;

type UrlPathsKeys = keyof typeof UrlPaths;
type UrlPathsValues = (typeof UrlPaths)[UrlPathsKeys];

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
export const useRedirectHandler = (urlPath: UrlPathsValues) => {
  const history = useHistory();

  return useCallback(
    (state?: unknown) => history.push(urlPath, state),
    [history, urlPath]
  );
};
