import { Redirect } from "react-router";
import { StoreProvider, useStore } from "@/shared/store/provider";
import { reducer, initialState } from "@/shared/store/reducer";
import type { State, Actions } from "@/shared/store/types";
import { ListPage } from "@/shared/components/ListPage";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { FileSystemsTabbedNav } from "../components/FileSystemsTabbedNav";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";
import { ResourceStatusBoundary } from "@/shared/components/ResourceStatusBoundary";
import { FileSystemsCreateButton } from "../components/FileSystemsCreateButton";
import { useWatchFileSystem } from "@/shared/hooks/useWatchFileSystems";
import {
  UrlPaths,
  useRedirectHandler,
} from "@/shared/hooks/useRedirectHandler";

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

  const [storageClusters, storageClustersLoaded, storageClustersError] =
    useWatchSpectrumScaleCluster({ limit: 1 });

  const [fileSystems] = useWatchFileSystem();

  const redirectToCreateFileSystems = useRedirectHandler(
    "/fusion-access/file-systems/create"
  );

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
      alert={store.alert}
      onDismissAlert={() => dispatch({ type: "global/dismissAlert" })}
      actions={
        (fileSystems ?? []).length > 0 ? (
          <FileSystemsCreateButton onClick={redirectToCreateFileSystems} />
        ) : null
      }
    >
      <ResourceStatusBoundary
        loaded={storageClustersLoaded}
        error={storageClustersError}
      >
        {(storageClusters ?? []).length === 0 ? (
          <Redirect to={UrlPaths.StorageClusterHome} />
        ) : (
          <FileSystemsTabbedNav />
        )}
      </ResourceStatusBoundary>
    </ListPage>
  );
};

ConnectedFileSystemsHomePage.displayName = "ConnectedFileSystemsHomePage";
