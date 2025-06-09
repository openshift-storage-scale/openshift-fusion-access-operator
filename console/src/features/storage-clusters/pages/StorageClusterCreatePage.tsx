import { Redirect, useHistory } from "react-router";
import { StoreProvider, useStore } from "@/contexts/store/provider";
import type { State, Actions } from "@/contexts/store/types";
import { reducer, initialState } from "@/contexts/store/reducer";
import { NodesSelectionTable } from "@/features/storage-clusters/components/NodesSelectionTable";
import { ListPage } from "@/shared/components/ListPage";
import { StorageClustersCreateButton } from "@/features/storage-clusters/components/StorageClustersCreateButton";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { Split } from "@patternfly/react-core";
import { useCreateStorageClusterHandler } from "@/features/storage-clusters/hooks/useCreateStorageClusterHandler";
import { CancelButton } from "@/shared/components/CancelButton";

const StorageClusterCreate: React.FC = () => {
  const [cluster] = useWatchSpectrumScaleCluster({ isList: true, limit: 1 });
  return cluster.length === 0 ? (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <ConnectedStorageClusterCreate />
    </StoreProvider>
  ) : (
    <Redirect to={"/fusion-access/file-systems"} />
  );
};
StorageClusterCreate.displayName = "StorageClusterCreate";

export default StorageClusterCreate;

const ConnectedStorageClusterCreate: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const [store, dispatch] = useStore<State, Actions>();
  const handleCreateStorageCluster = useCreateStorageClusterHandler();
  const history = useHistory();

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Create storage cluster")}
      alert={store.alert}
      onDismissAlert={() => dispatch({ type: "dismissAlert" })}
      footer={
        <Split hasGutter>
          <StorageClustersCreateButton
            key="create-button"
            isDisabled={store.ctas.createStorageCluster.isDisabled}
            isLoading={store.ctas.createStorageCluster.isLoading}
            onCreateStorageCluster={handleCreateStorageCluster}
          />
          <CancelButton key="cancel-button" onCancel={history.goBack} />
        </Split>
      }
    >
      <NodesSelectionTable />
    </ListPage>
  );
};
ConnectedStorageClusterCreate.displayName = "ConnectedStorageClusterCreate";
