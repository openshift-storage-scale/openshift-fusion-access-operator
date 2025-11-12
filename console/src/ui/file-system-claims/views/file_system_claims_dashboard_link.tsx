import type { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";
import { Button } from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import { useMemo } from "react";
import { VALUE_NOT_AVAILABLE } from "@/constants";
import type { Route } from "@/domain/models/routes";
import { useWatchStorageCluster } from "@/shared/hooks/useWatchStorageCluster";
import {
  type NormalizedWatchK8sResult,
  useNormalizedK8sWatchResource,
} from "@/shared/utils/console/UseK8sWatchResource";

export const FileSystemsDashboardLink: React.FC<{
  fileSystemName: string;
}> = ({ fileSystemName }) => {
  const routesResult = useRoutes();
  const routes = routesResult.data ?? [];

  if (!routes.length) {
    return <span className="text-secondary">{VALUE_NOT_AVAILABLE}</span>;
  }

  const { host } = routes[0].spec;

  return (
    <Button
      component="a"
      variant="link"
      target="_blank"
      rel="noopener noreferrer"
      href={`https://${host}/gui#files-filesystems-/${fileSystemName}`}
      icon={<ExternalLinkAltIcon />}
      iconPosition="end"
      isInline
    />
  );
};
FileSystemsDashboardLink.displayName = "GpfsDashboardLink";

export const useRoutes = (): NormalizedWatchK8sResult<Route[]> => {
  const storageClusters = useWatchStorageCluster({ limit: 1 });

  // Currently, we support creation of a single StorageCluster.
  const [storageCluster] = storageClusters.data ?? [];
  const storageClusterName =
    (storageCluster?.metadata as K8sResourceCommon["metadata"])?.name ??
    VALUE_NOT_AVAILABLE;

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
    [
      routes.data,
      routes.error,
      routes.loaded,
      storageClusters.error,
      storageClusters.loaded,
    ],
  );
};
