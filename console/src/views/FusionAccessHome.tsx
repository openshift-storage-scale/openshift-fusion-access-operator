import { useCallback } from "react";
import { Redirect, useHistory } from "react-router";
import { FusionAccessListPage } from "@/components/FusionAccessListPage";
import { StorageClusterEmptyState } from "@/components/StorageClusterEmptyState";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/hooks/useWatchSpectrumScaleCluster";
import { ReactNodeWithPredefinedFallback } from "@/components/ReactNodeWithPredefinedFallback";
import { initialState, reducer } from "@/contexts/store/reducer";
import type { State, Actions } from "@/contexts/store/types";
import { StoreProvider, useStore } from "@/contexts/store/provider";

const FusionAccessHome: React.FC = () => {
  return (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <ConnectedFusionAccessHome />
    </StoreProvider>
  );
};
FusionAccessHome.displayName = "FusionAccessHome";
export default FusionAccessHome;

const ConnectedFusionAccessHome: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const [storageClusters, storageClustersLoaded, storageClustersError] =
    useWatchSpectrumScaleCluster({ isList: true, limit: 1 });

  const history = useHistory();
  const handleCreateStorageCluster = useCallback(() => {
    history.push("/fusion-access/storage-cluster/create");
  }, [history]);
  const [store, dispatch] = useStore<State, Actions>();

  return storageClusters.length === 0 ? (
    <FusionAccessListPage
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
    </FusionAccessListPage>
  ) : (
    <Redirect to={"/fusion-access/file-systems"} />
  );
};

ConnectedFusionAccessHome.displayName = "ConnectedFusionAccessHome";
