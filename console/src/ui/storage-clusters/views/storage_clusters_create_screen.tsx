import { Button, Split } from "@patternfly/react-core";
import { useStorageClustersCreateUseCase } from "@/domain/use-cases/use_storage_clusters_create_use_case";
import { ListPage } from "@/shared/components/ListPage";
import { StoreProvider, useStore } from "@/shared/store/provider";
import { initialState, reducer } from "@/shared/store/reducer";
import type { Actions, State } from "@/shared/store/types";
import { useRedirectHandler } from "@/shared/utils/use_redirect_handler";
import { useLocalizationService } from "@/ui/services/use_localization_service";
import { StorageClustersCreateButton } from "@/ui/storage-clusters/views/storage_clusters_create_button";
import { StorageClustersNodesSelectionTable } from "@/ui/storage-clusters/views/storage_clusters_nodes_selection_table";

const ConnectedStorageClustersCreateScreen: React.FC = () => {
  const { t } = useLocalizationService();
  const [store] = useStore<State, Actions>();
  const handleCreateStorageCluster = useStorageClustersCreateUseCase();
  const redirectToStorageClusterHome = useRedirectHandler(
    "/fusion-access/storage-cluster",
  );

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Create storage cluster")}
      alerts={store.alerts}
      footer={
        <Split hasGutter>
          <StorageClustersCreateButton
            {...store.cta}
            onClick={handleCreateStorageCluster}
          />
          <Button variant="link" onClick={redirectToStorageClusterHome}>
            {t("Cancel")}
          </Button>
        </Split>
      }
    >
      <StorageClustersNodesSelectionTable />
    </ListPage>
  );
};
ConnectedStorageClustersCreateScreen.displayName =
  "ConnectedStorageClustersCreateScreen";

const StorageClustersCreateScreen: React.FC = () => (
  <StoreProvider<State, Actions> reducer={reducer} initialState={initialState}>
    <ConnectedStorageClustersCreateScreen />
  </StoreProvider>
);
StorageClustersCreateScreen.displayName = "StorageClustersCreateScreen";
export default StorageClustersCreateScreen;
