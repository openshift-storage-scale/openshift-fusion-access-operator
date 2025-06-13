import { Redirect, useHistory } from "react-router";
import { StoreProvider, useStore } from "@/shared/store/provider";
import { reducer, initialState } from "@/shared/store/reducer";
import type { State, Actions } from "@/shared/store/types";
import { ListPage } from "@/shared/components/ListPage";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { FileSystemsTabbedNav } from "../components/FileSystemsTabbedNav";
import { FileSystemsCreateButton } from "../components/FileSystemsCreateButton";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { ResourceStatusBoundary } from "@/shared/components/ResourceStatusBoundary";
import {
  FILE_SYSTEMS_CREATE_URLPATH,
  STORAGE_CLUSTER_HOME_URLPATH,
} from "@/constants";

const FileSystemsHomePage: React.FC = () => {
  return (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <ConnectedFileSystemsHomePage />
    </StoreProvider>
  );
};
FileSystemsHomePage.displayName = "FusionAccessHome";
export default FileSystemsHomePage;

const ConnectedFileSystemsHomePage: React.FC = () => {
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
      actions={
        <FileSystemsCreateButton
          key="create-filesystem"
          onCreateFileSystem={() => {
            history.push(FILE_SYSTEMS_CREATE_URLPATH);
          }}
        />
      }
    >
      <ResourceStatusBoundary
        loaded={storageClustersLoaded}
        error={storageClustersError}
      >
        {(storageClusters ?? []).length === 0 ? (
          <Redirect to={STORAGE_CLUSTER_HOME_URLPATH} />
        ) : (
          <FileSystemsTabbedNav />
        )}
      </ResourceStatusBoundary>
    </ListPage>
  );
};

ConnectedFileSystemsHomePage.displayName = "ConnectedFileSystemsHomePage";
