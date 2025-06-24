import { Redirect, useHistory } from "react-router";
import { StoreProvider, useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { reducer, initialState } from "@/shared/store/reducer";
import { NodesSelectionTable } from "@/features/storage-clusters/components/NodesSelectionTable";
import { ListPage } from "@/shared/components/ListPage";
import { StorageClustersCreateButton } from "@/features/storage-clusters/components/StorageClustersCreateButton";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { Split } from "@patternfly/react-core";
import { useCreateStorageClusterHandler } from "@/features/storage-clusters/hooks/useCreateStorageClusterHandler";
import { CancelButton } from "@/shared/components/CancelButton";
import { FILE_SYSTEMS_HOME_URL_PATH } from "@/constants";

const StorageClusterCreate: React.FC = () => {
  const [cluster] = useWatchSpectrumScaleCluster({ limit: 1 });
  return (cluster ?? []).length === 0 ? (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <ConnectedStorageClusterCreate />
    </StoreProvider>
  ) : (
    <Redirect to={FILE_SYSTEMS_HOME_URL_PATH} />
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
      onDismissAlert={() => dispatch({ type: "global/dismissAlert" })}
      footer={
        <Split hasGutter>
          <StorageClustersCreateButton
            {...store.cta}
            onCreateStorageCluster={handleCreateStorageCluster}
          />
          <CancelButton onCancel={history.goBack} />
        </Split>
      }
    >
      <NodesSelectionTable />
    </ListPage>
  );
};
ConnectedStorageClusterCreate.displayName = "ConnectedStorageClusterCreate";
