import { useMemo } from "react";
import { Redirect } from "react-router";
import { ListPage } from "@/shared/components/ListPage";
import { ResourceStatusBoundary } from "@/shared/components/ResourceStatusBoundary";
import { useWatchFusionAccess } from "@/shared/hooks/useWatchFusionAccess";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { UrlPaths } from "@/shared/hooks/useRedirectHandler";

const FusionAccessHomePage: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const fusionAccess = useWatchFusionAccess();

  const storageClusters = useWatchSpectrumScaleCluster({
    limit: 1,
  });

  const fusionAccessStatus = useMemo(
    () => fusionAccess.data?.status?.status,
    [fusionAccess.data?.status?.status]
  );

  const loaded = useMemo(
    () =>
      fusionAccess.loaded &&
      storageClusters.loaded &&
      fusionAccessStatus === "Ready",
    [fusionAccess.loaded, fusionAccessStatus, storageClusters.loaded]
  );

  const error = useMemo(
    () => fusionAccess.error || storageClusters.error,
    [fusionAccess.error, storageClusters.error]
  );

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
    >
      <ResourceStatusBoundary loaded={loaded} error={error}>
        {(storageClusters.data ?? []).length === 0 ? (
          <Redirect to={UrlPaths.StorageClusterHome} />
        ) : (
          <Redirect to={UrlPaths.FileSystemsHome} />
        )}
      </ResourceStatusBoundary>
    </ListPage>
  );
};
FusionAccessHomePage.displayName = "FusionAccessHomePage";
export default FusionAccessHomePage;
