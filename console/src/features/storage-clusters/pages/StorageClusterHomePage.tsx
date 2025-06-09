import { useCallback } from "react";
import { Redirect, useHistory } from "react-router";
import { ListPage } from "@/shared/components/ListPage";
import { StorageClusterEmptyState } from "@/features/storage-clusters/components/StorageClusterEmptyState";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { ReactNodeWithPredefinedFallback } from "@/shared/components/ReactNodeWithPredefinedFallback";
import { initialState, reducer } from "@/contexts/store/reducer";
import type { State, Actions } from "@/contexts/store/types";
import { StoreProvider, useStore } from "@/contexts/store/provider";

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
  const [storageClusters, storageClustersLoaded, storageClustersError] =
    useWatchSpectrumScaleCluster({ isList: true, limit: 1 });

  const history = useHistory();
  const handleCreateStorageCluster = useCallback(() => {
    history.push("/fusion-access/storage-cluster/create");
  }, [history]);
  const [store, dispatch] = useStore<State, Actions>();

  return storageClusters.length === 0 ? (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
      alert={store.alert}
      onDismissAlert={() => dispatch({ type: "dismissAlert" })}
    >
      <ReactNodeWithPredefinedFallback
        loaded={storageClustersLoaded}
        error={storageClustersError}
      >
        <StorageClusterEmptyState
          onCreateStorageCluster={handleCreateStorageCluster}
        />
      </ReactNodeWithPredefinedFallback>
    </ListPage>
  ) : (
    <Redirect to={"/fusion-access/file-systems"} />
  );
};

ConnectedStorageClusterHomePage.displayName = "ConnectedFusionAccessHomePage";
