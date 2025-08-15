import { useMemo } from "react";
import { Redirect } from "react-router";
import { ListPage } from "@/shared/components/ListPage";
import { Async } from "@/shared/components/Async";
import { useWatchFusionAccess } from "@/shared/hooks/useWatchFusionAccess";
import { useWatchStorageCluster } from "@/shared/hooks/useWatchStorageCluster";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { UrlPaths } from "@/shared/hooks/useRedirectHandler";
import { DefaultErrorFallback } from "@/shared/components/DefaultErrorFallback";
import { DefaultLoadingFallback } from "@/shared/components/DefaultLoadingFallback";

const FusionAccessHomePage: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const fusionAccess = useWatchFusionAccess();

  const storageClusters = useWatchStorageCluster({
    limit: 1,
  });

  const fusionAccessStatus = useMemo(
    () => fusionAccess.data?.status?.status,
    [fusionAccess.data?.status?.status]
  );

  const loaded = useMemo(
    () =>
      fusionAccess.loaded &&
      storageClusters.loaded,
    // #TODO check if we really need Ready status from fusionaccess for the UI to show the home page
    // (fusionAccessStatus === "Ready",
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
      <Async
        loaded={loaded}
        error={error}
        renderErrorFallback={DefaultErrorFallback}
        renderLoadingFallback={DefaultLoadingFallback}
      >
        {(storageClusters.data ?? []).length === 0 ? (
          <Redirect to={UrlPaths.StorageClusterHome} />
        ) : (
          <Redirect to={UrlPaths.FileSystemsHome} />
        )}
      </Async>
    </ListPage>
  );
};
FusionAccessHomePage.displayName = "FusionAccessHomePage";
export default FusionAccessHomePage;
