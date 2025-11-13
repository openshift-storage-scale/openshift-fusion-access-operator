import { HorizontalNav } from "@openshift-console/dynamic-plugin-sdk";
import { useEffect } from "react";
import { Async } from "@/shared/components/Async";
import { DefaultErrorFallback } from "@/shared/components/DefaultErrorFallback";
import { DefaultLoadingFallback } from "@/shared/components/DefaultLoadingFallback";
import { ListPage } from "@/shared/components/ListPage";
import { StoreProvider } from "@/shared/store/provider";
import { initialState, reducer } from "@/shared/store/reducer";
import type { Actions, State } from "@/shared/store/types";
import { useFileSystemClaimsHomeScreenViewModel } from "../view-models/use_file_system_claims_home_screen_view_model";
import { FileSystemClaimsCreateButton } from "./file_system_claims_create_button";

const ConnectedFileSystemClaimsHomeScreen: React.FC = () => {
  const vm = useFileSystemClaimsHomeScreenViewModel();

  return (
    <ListPage
      documentTitle={vm.documentTitle}
      title={vm.title}
      alerts={vm.alerts}
      actions={
        vm.fileSystemClaims.length > 0 ? (
          <FileSystemClaimsCreateButton
            onClick={vm.goToFileSystemClaimsCreateScreen}
          />
        ) : null
      }
    >
      <Async
        loaded={vm.loaded}
        error={vm.error}
        renderErrorFallback={DefaultErrorFallback}
        renderLoadingFallback={DefaultLoadingFallback}
      >
        <HorizontalNav pages={vm.pages} />
      </Async>
    </ListPage>
  );
};

ConnectedFileSystemClaimsHomeScreen.displayName =
  "ConnectedFileSystemClaimsHomeScreen";

const FileSystemClaimsHomeScreen: React.FC = () => (
  <StoreProvider<State, Actions> reducer={reducer} initialState={initialState}>
    <ConnectedFileSystemClaimsHomeScreen />
  </StoreProvider>
);
FileSystemClaimsHomeScreen.displayName = "FileSystemClaimsHomeScreen";
export default FileSystemClaimsHomeScreen;
