import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { Button, Skeleton } from "@patternfly/react-core";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import type { Route } from "../types/Route";

type FileSystemsDashboardLinkProps = {
  fileSystem: FileSystem;
  routes: Route[];
  loaded: boolean;
  isDisabled?: boolean;
};

export const FileSystemsDashboardLink: React.FC<
  FileSystemsDashboardLinkProps
> = ({ fileSystem, routes, loaded, isDisabled = false }) => {
  const { t } = useFusionAccessTranslations();

  if (!loaded) {
    return (
      <Skeleton screenreaderText={t("Loading file system dashboard link")} />
    );
  }

  if (!routes.length) {
    return <span className="text-secondary">{t("Not available")}</span>;
  }

  const href = `https://${routes[0].spec.host}/gui#files-filesystems-/${fileSystem.metadata?.name || ""}`;

  return (
    <Button
      component="a"
      variant="link"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      icon={<ExternalLinkAltIcon />}
      iconPosition="end"
      isInline
      isDisabled={isDisabled}
    >
      {fileSystem.metadata?.name || ""}
    </Button>
  );
};
FileSystemsDashboardLink.displayName = "GpfsDashboardLink";
