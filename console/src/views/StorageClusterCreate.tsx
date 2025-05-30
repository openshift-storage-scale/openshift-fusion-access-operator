import { Redirect, useHistory } from "react-router";
import { StoreProvider, useStoreContext } from "@/contexts/store/provider";
import type { State, Actions } from "@/contexts/store/types";
import { reducer, initialState } from "@/contexts/store/reducer";
// import { DownloadLogsButton } from "@/components/DownloadLogsButton";
import { NodesSelectionTable } from "@/components/NodesSelectionTable";
import { FusionAccessListPage } from "@/components/FusionAccessListPage";
import { CreateStorageClusterButton } from "@/components/CreateStorageClusterButton";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/hooks/useWatchSpectrumScaleCluster";
import { useCreateStorageClusterHandler } from "@/hooks/useCreateStorageClusterHandler";
import { Split } from "@patternfly/react-core";
import { CancelButton } from "@/components/CancelButton";

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
  const [store] = useStoreContext<State, Actions>();
  const handleCreateStorageCluster = useCreateStorageClusterHandler();
  const history = useHistory();

  return (
    <FusionAccessListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Create storage cluster")}
      alerts={store.alerts}
      footer={
        <Split hasGutter>
          <CreateStorageClusterButton
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
    </FusionAccessListPage>
  );
};
ConnectedStorageClusterCreate.displayName = "ConnectedStorageClusterCreate";
