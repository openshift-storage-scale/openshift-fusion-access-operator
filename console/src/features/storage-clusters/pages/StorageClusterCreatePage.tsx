import { Redirect, useHistory } from "react-router";
import { StoreProvider, useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { reducer, initialState } from "@/shared/store/reducer";
import { NodesSelectionTable } from "@/features/storage-clusters/components/NodesSelectionTable";
import { ListPage } from "@/shared/components/ListPage";
import { StorageClustersCreateButton } from "@/features/storage-clusters/components/StorageClustersCreateButton";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { Button, Split } from "@patternfly/react-core";
import { useCreateStorageClusterHandler } from "@/features/storage-clusters/hooks/useCreateStorageClusterHandler";
import { UrlPaths } from "@/shared/hooks/useRedirectHandler";

const StorageClusterCreate: React.FC = () => {
  const storageCluster = useWatchSpectrumScaleCluster({ limit: 1 });
  return (storageCluster.data ?? []).length === 0 ? (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <ConnectedStorageClusterCreate />
    </StoreProvider>
  ) : (
    <Redirect to={UrlPaths.FileSystemsHome} />
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
            onClick={handleCreateStorageCluster}
          />
          <Button variant="link" onClick={history.goBack}>
            {t("Cancel")}
          </Button>
        </Split>
      }
    >
      <NodesSelectionTable />
    </ListPage>
  );
};
ConnectedStorageClusterCreate.displayName = "ConnectedStorageClusterCreate";
