import { Button } from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import { VALUE_NOT_AVAILABLE } from "@/constants";
import type { Filesystem } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Filesystem";
import type { Route } from "../types/Route";
import type { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";

type FileSystemsDashboardLinkProps = {
  fileSystem: Filesystem;
  routes: Route[] | null;
  isNotAvailable?: boolean;
};

export const FileSystemsDashboardLink: React.FC<
  FileSystemsDashboardLinkProps
> = ({ fileSystem, routes, isNotAvailable = false }) => {
  if (!routes || !routes.length || isNotAvailable) {
    return <span className="text-secondary">{VALUE_NOT_AVAILABLE}</span>;
  }

  const fileSystemName = (fileSystem.metadata as K8sResourceCommon['metadata'])?.name ?? "";
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
    >
      {fileSystemName}
    </Button>
  );
};
FileSystemsDashboardLink.displayName = "GpfsDashboardLink";
