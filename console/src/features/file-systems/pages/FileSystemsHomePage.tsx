import { Redirect } from "react-router";
import { StoreProvider, useStore } from "@/shared/store/provider";
import { reducer, initialState } from "@/shared/store/reducer";
import type { State, Actions } from "@/shared/store/types";
import { ListPage } from "@/shared/components/ListPage";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { FileSystemsTabbedNav } from "../components/FileSystemsTabbedNav";
import { useWatchStorageCluster } from "@/shared/hooks/useWatchStorageCluster";
import { Async } from "@/shared/components/Async";
import { FileSystemsCreateButton } from "../components/FileSystemsCreateButton";
import { useWatchFileSystem } from "@/shared/hooks/useWatchFileSystem";
import { useWatchFilesystemJobs } from "@/shared/hooks/useWatchFilesystemJobs";
import {
  UrlPaths,
  useRedirectHandler,
} from "@/shared/hooks/useRedirectHandler";
import { DefaultErrorFallback } from "@/shared/components/DefaultErrorFallback";
import { DefaultLoadingFallback } from "@/shared/components/DefaultLoadingFallback";

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

  const [store] = useStore<State, Actions>();

  const storageClusters = useWatchStorageCluster({ limit: 1 });

  const fileSystems = useWatchFileSystem();
  const { jobs: filesystemJobs } = useWatchFilesystemJobs();

  const redirectToCreateFileSystems = useRedirectHandler(
    "/fusion-access/file-systems/create"
  );

  // Show create button if we have any filesystems OR any jobs (active or completed)
  // This ensures the button is always available unless it's truly an empty state
  const hasFilesystemActivity = (fileSystems.data ?? []).length > 0 || filesystemJobs.length > 0;

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
      alerts={store.alerts}
      actions={
        hasFilesystemActivity ? (
          <FileSystemsCreateButton onClick={redirectToCreateFileSystems} />
        ) : null
      }
    >
      <Async
        loaded={storageClusters.loaded}
        error={storageClusters.error}
        renderErrorFallback={DefaultErrorFallback}
        renderLoadingFallback={DefaultLoadingFallback}
      >
        {(storageClusters.data ?? []).length === 0 ? (
          <Redirect to={UrlPaths.StorageClusterHome} />
        ) : (
          <FileSystemsTabbedNav />
        )}
      </Async>
    </ListPage>
  );
};

ConnectedFileSystemsHomePage.displayName = "ConnectedFileSystemsHomePage";
