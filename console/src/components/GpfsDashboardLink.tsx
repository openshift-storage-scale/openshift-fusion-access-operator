import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/hooks/useWatchSpectrumScaleCluster";
import {
  useK8sWatchResource,
  type K8sResourceCommon,
} from "@openshift-console/dynamic-plugin-sdk";
import { Button, Skeleton } from "@patternfly/react-core";
import type { FileSystem } from "@/models/ibm-spectrum-scale/FileSystem";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";

type GpfsDashboardLinkProps = {
  fileSystem: FileSystem;
  routes: Route[];
  loaded: boolean;
};

export type Route = K8sResourceCommon & {
  spec: {
    host: string;
  };
};

const GpfsDashboardLink: React.FC<GpfsDashboardLinkProps> = ({
  fileSystem,
  routes,
  loaded,
}) => {
  const { t } = useFusionAccessTranslations();

  if (!loaded) {
    return <Skeleton screenreaderText={t("Loading gpfs dashboard link")} />;
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
    >
      {fileSystem.metadata?.name || ""}
    </Button>
  );
};

export default GpfsDashboardLink;
