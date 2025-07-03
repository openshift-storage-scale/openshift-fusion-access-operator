import { Redirect } from "react-router";
import { ListPage } from "@/shared/components/ListPage";
import { StorageClusterEmptyState } from "@/features/storage-clusters/components/StorageClusterEmptyState";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchStorageCluster } from "@/shared/hooks/useWatchStorageCluster";
import { Async } from "@/shared/components/Async";
import { initialState, reducer } from "@/shared/store/reducer";
import type { State, Actions } from "@/shared/store/types";
import { StoreProvider, useStore } from "@/shared/store/provider";
import {
  UrlPaths,
  useRedirectHandler,
} from "@/shared/hooks/useRedirectHandler";
import { DefaultErrorFallback } from "@/shared/components/DefaultErrorFallback";
import { DefaultLoadingFallback } from "@/shared/components/DefaultLoadingFallback";
import { LEARN_MORE_LINK } from "@/constants";

const StorageClusterHomePage: React.FC = () => {
  return (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <ConnectedStorageClusterHomePage />
    </StoreProvider>
  );
};
StorageClusterHomePage.displayName = "FusionAccessHome";
export default StorageClusterHomePage;

const ConnectedStorageClusterHomePage: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const [store, dispatch] = useStore<State, Actions>();

  const redirectToCreateStorageCluster = useRedirectHandler(
    "/fusion-access/storage-cluster/create"
  );

  const storageClusters = useWatchStorageCluster({ limit: 1 });

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Fusion Access for SAN")}
      alert={store.alert}
      onDismissAlert={() => dispatch({ type: "global/dismissAlert" })}
    >
      <Async
        loaded={storageClusters.loaded}
        error={storageClusters.error}
        renderErrorFallback={DefaultErrorFallback}
        renderLoadingFallback={DefaultLoadingFallback}
      >
        {(storageClusters.data ?? []).length === 0 ? (
          <StorageClusterEmptyState
            onCreateStorageCluster={redirectToCreateStorageCluster}
            learnMoreHref={LEARN_MORE_LINK}
          />
        ) : (
          <Redirect to={UrlPaths.FileSystemsHome} />
        )}
      </Async>
    </ListPage>
  );
};
ConnectedStorageClusterHomePage.displayName = "ConnectedFusionAccessHomePage";
