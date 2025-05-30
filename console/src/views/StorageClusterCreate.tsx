import { Redirect } from "react-router";
import { StoreProvider, useStoreContext } from "@/contexts/store/context";
import type { State, Actions } from "@/contexts/store/types";
import { reducer, initialState } from "@/contexts/store/reducer";
// import { DownloadLogsButton } from "@/components/DownloadLogsButton";
import { NodesSelectionTable } from "@/components/NodesSelectionTable";
import { FusionAccessListPage } from "@/components/FusionAccessListPage";
import { CreateStorageClusterButton } from "@/components/CreateStorageClusterButton";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/hooks/useWatchSpectrumScaleCluster";
import { useCreateStorageClusterHandler } from "@/hooks/useCreateStorageClusterHandler";
import { MINIMUM_AMOUNT_OF_NODES } from "@/constants";

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

  return (
    <FusionAccessListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
      description={t(
        "To create a storage cluster select at least {{MINIMUM_AMOUNT_OF_NODES}} nodes that share the same amount of disks.",
        { MINIMUM_AMOUNT_OF_NODES }
      )}
      // actions={[<DownloadLogsButton key="download-logs" />]}
      alerts={store.alerts}
      footer={
        <CreateStorageClusterButton
          key="create-storagecluster"
          isDisabled={store.ctas.createStorageCluster.isDisabled}
          isLoading={store.ctas.createStorageCluster.isLoading}
          onCreateStorageCluster={handleCreateStorageCluster}
        />
      }
    >
      <NodesSelectionTable />
    </FusionAccessListPage>
  );
};
ConnectedStorageClusterCreate.displayName = "ConnectedStorageClusterCreate";
