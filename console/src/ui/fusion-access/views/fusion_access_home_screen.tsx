import { Redirect } from "react-router";
import { Async } from "@/shared/components/Async";
import { DefaultErrorFallback } from "@/shared/components/DefaultErrorFallback";
import { DefaultLoadingFallback } from "@/shared/components/DefaultLoadingFallback";
import { ListPage } from "@/shared/components/ListPage";
import { UrlPaths } from "@/shared/utils/use_redirect_handler";
import { useLocalizationService } from "@/ui/services/use_localization_service";
import { useFusionAccessHomeScreenViewModel } from "../view-models/use_fusion_access_home_screen_view_model";

const FusionAccessHomeScreen: React.FC = () => {
  const { t } = useLocalizationService();
  const vm = useFusionAccessHomeScreenViewModel();

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
    >
      <Async
        loaded={vm.loaded}
        error={vm.error}
        renderErrorFallback={DefaultErrorFallback}
        renderLoadingFallback={DefaultLoadingFallback}
      >
        {vm.hasStorageClusterNotBeenCreated ? (
          <Redirect to={UrlPaths.StorageClustersHome} />
        ) : (
          <Redirect to={UrlPaths.FileSystemClaimsHome} />
        )}
      </Async>
    </ListPage>
  );
};
FusionAccessHomeScreen.displayName = "FusionAccessHomeScreen";
export default FusionAccessHomeScreen;
