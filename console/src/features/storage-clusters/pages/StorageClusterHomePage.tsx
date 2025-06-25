import { Redirect } from "react-router";
import { ListPage } from "@/shared/components/ListPage";
import { StorageClusterEmptyState } from "@/features/storage-clusters/components/StorageClusterEmptyState";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { ResourceStatusBoundary } from "@/shared/components/ResourceStatusBoundary";
import { initialState, reducer } from "@/shared/store/reducer";
import type { State, Actions } from "@/shared/store/types";
import { StoreProvider, useStore } from "@/shared/store/provider";
import {
  UrlPaths,
  useRedirectHandler,
} from "@/shared/hooks/useRedirectHandler";

const StorageClusterHomePage: React.FC = () => {
  return (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <ConnectedStorageClusterHomePage />
    </StoreProvider>
  );
};
StorageClusterHomePage.displayName = "FusionAccessHome";
export default StorageClusterHomePage;

const ConnectedStorageClusterHomePage: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const [store, dispatch] = useStore<State, Actions>();

  const redirectToCreateStorageCluster = useRedirectHandler(
    "/fusion-access/storage-cluster/create"
  );

  const storageClusters = useWatchSpectrumScaleCluster({ limit: 1 });

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
      alert={store.alert}
      onDismissAlert={() => dispatch({ type: "global/dismissAlert" })}
    >
      <ResourceStatusBoundary
        loaded={storageClusters.loaded}
        error={storageClusters.error}
      >
        {(storageClusters.data ?? []).length === 0 ? (
          <StorageClusterEmptyState
            onCreateStorageCluster={redirectToCreateStorageCluster}
          />
        ) : (
          <Redirect to={UrlPaths.FileSystemsHome} />
        )}
      </ResourceStatusBoundary>
    </ListPage>
  );
};
ConnectedStorageClusterHomePage.displayName = "ConnectedFusionAccessHomePage";
