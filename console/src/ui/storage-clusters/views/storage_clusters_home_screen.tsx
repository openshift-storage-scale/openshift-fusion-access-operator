import { useEffect } from "react";
import { Redirect } from "react-router";
import { useStorageClustersRepository } from "@/data/repositories/use_storage_clusters_repository";
import { Async } from "@/shared/components/Async";
import { DefaultErrorFallback } from "@/shared/components/DefaultErrorFallback";
import { DefaultLoadingFallback } from "@/shared/components/DefaultLoadingFallback";
import { ListPage } from "@/shared/components/ListPage";
import { StoreProvider, useStore } from "@/shared/store/provider";
import { initialState, reducer } from "@/shared/store/reducer";
import type { Actions, State } from "@/shared/store/types";
import {
  UrlPaths,
  useRedirectHandler,
} from "@/shared/utils/use_redirect_handler";
import { useLocalizationService } from "@/ui/services/use_localization_service";
import { StorageClusterEmptyState } from "@/ui/storage-clusters/views/storage_clusters_empty_state";

const ConnectedStorageClustersHomeScreen: React.FC = () => {
  const { t } = useLocalizationService();
  const [store] = useStore<State, Actions>();
  const goToCreateStorageCluster = useRedirectHandler(
    "/fusion-access/storage-cluster/create",
  );
  const storageClustersRepository = useStorageClustersRepository();

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
      alerts={store.alerts}
    >
      <Async
        loaded={storageClustersRepository.loaded}
        error={storageClustersRepository.error}
        renderErrorFallback={DefaultErrorFallback}
        renderLoadingFallback={DefaultLoadingFallback}
      >
        <StorageClusterEmptyState
          onCreateStorageCluster={goToCreateStorageCluster}
        />
      </Async>
    </ListPage>
  );
};
ConnectedStorageClustersHomeScreen.displayName =
  "ConnectedStorageClustersHomeScreen";

export const StorageClustersHomeScreen: React.FC = () => (
  <StoreProvider<State, Actions> reducer={reducer} initialState={initialState}>
    <ConnectedStorageClustersHomeScreen />
  </StoreProvider>
);
StorageClustersHomeScreen.displayName = "StorageClustersHomeScreen";
export default StorageClustersHomeScreen;
