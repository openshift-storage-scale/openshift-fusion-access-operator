import { useMemo } from "react";
import { Redirect } from "react-router";
import { ListPage } from "@/shared/components/ListPage";
import { ResourceStatusBoundary } from "@/shared/components/ResourceStatusBoundary";
import { useWatchFusionAccess } from "@/shared/hooks/useWatchFusionAccess";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import {
  FILE_SYSTEMS_HOME_URL_PATH,
  STORAGE_CLUSTER_HOME_URL_PATH,
} from "@/constants";

const FusionAccessHomePage: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const [fusionAccess, fusionAccessLoaded, fusionAccessLoadError] =
    useWatchFusionAccess();

  const [storageClusters, storageClustersLoaded, storageClustersLoadError] =
    useWatchSpectrumScaleCluster({
      limit: 1,
    });

  const fusionAccessStatus = useMemo(
    () => fusionAccess?.status?.status,
    [fusionAccess?.status?.status]
  );

  const loaded = useMemo(
    () =>
      fusionAccessLoaded &&
      fusionAccessStatus === "Ready" &&
      storageClustersLoaded,
    [fusionAccessLoaded, fusionAccessStatus, storageClustersLoaded]
  );

  const error = useMemo(
    () => fusionAccessLoadError || storageClustersLoadError,
    [fusionAccessLoadError, storageClustersLoadError]
  );

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
    >
      <ResourceStatusBoundary loaded={loaded} error={error}>
        {(storageClusters ?? []).length === 0 ? (
          <Redirect to={STORAGE_CLUSTER_HOME_URL_PATH} />
        ) : (
          <Redirect to={FILE_SYSTEMS_HOME_URL_PATH} />
        )}
      </ResourceStatusBoundary>
    </ListPage>
  );
};
FusionAccessHomePage.displayName = "FusionAccessHomePage";
export default FusionAccessHomePage;
