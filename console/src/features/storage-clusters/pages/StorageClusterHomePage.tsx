import { Redirect, useHistory } from "react-router";
import { ListPage } from "@/shared/components/ListPage";
import { StorageClusterEmptyState } from "@/features/storage-clusters/components/StorageClusterEmptyState";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { ResourceStatusBoundary } from "@/shared/components/ResourceStatusBoundary";
import { initialState, reducer } from "@/shared/store/reducer";
import type { State, Actions } from "@/shared/store/types";
import { StoreProvider, useStore } from "@/shared/store/provider";
import {
  FILE_SYSTEMS_HOME_URL_PATH,
  STORAGE_CLUSTER_CREATE_URL_PATH,
} from "@/constants";

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

  const history = useHistory();

  const [storageClusters, storageClustersLoaded, storageClustersError] =
    useWatchSpectrumScaleCluster({ limit: 1 });

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
      alert={store.alert}
      onDismissAlert={() => dispatch({ type: "dismissAlert" })}
    >
      <ResourceStatusBoundary
        loaded={storageClustersLoaded}
        error={storageClustersError}
      >
        {(storageClusters ?? []).length === 0 ? (
          <StorageClusterEmptyState
            onCreateStorageCluster={() => {
              history.push(STORAGE_CLUSTER_CREATE_URL_PATH);
            }}
          />
        ) : (
          <Redirect to={FILE_SYSTEMS_HOME_URL_PATH} />
        )}
      </ResourceStatusBoundary>
    </ListPage>
  );
};
ConnectedStorageClusterHomePage.displayName = "ConnectedFusionAccessHomePage";
