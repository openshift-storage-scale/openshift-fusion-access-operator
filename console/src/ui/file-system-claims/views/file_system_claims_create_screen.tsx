import { Button, FormContextProvider, Split } from "@patternfly/react-core";
import { Redirect } from "react-router";
import { ListPage } from "@/shared/components/ListPage";
import { UrlPaths } from "@/shared/hooks/useRedirectHandler";
import { StoreProvider } from "@/shared/store/provider";
import { initialState, reducer } from "@/shared/store/reducer";
import type { Actions, State } from "@/shared/store/types";
import { useFileSystemClaimsCreateScreenViewModel } from "../view-models/use_file_system_claims_create_screen_view_model";
import { FileSystemClaimsCreateButton } from "./file_system_claims_create_button";
import { FileSystemClaimsCreateForm } from "./file_system_claims_create_form";

const ConnectedFileSystemClaimsCreateScreen: React.FC = () => {
  const vm = useFileSystemClaimsCreateScreenViewModel();

  if (vm.storageClusterHasNotBeenCreated) {
    return <Redirect to={UrlPaths.StorageClusterHome} />;
  }

  return (
    <ListPage
      documentTitle={vm.documentTitle}
      title={vm.title}
      description={vm.description}
      alerts={vm.alerts}
      footer={
        <Split hasGutter>
          <FileSystemClaimsCreateButton
            type="submit"
            form={vm.formId}
            {...vm.cta}
          />
          <Button variant="link" onClick={vm.goToFileSystemClaimsHomeScreen}>
            {vm.cancelButtonText}
          </Button>
        </Split>
      }
    >
      <FormContextProvider>
        <FileSystemClaimsCreateForm formId={vm.formId} />
      </FormContextProvider>
    </ListPage>
  );
};
ConnectedFileSystemClaimsCreateScreen.displayName =
  "ConnectedFileSystemClaimsCreateScreen";

const FileSystemClaimsCreateScreen: React.FC = () => (
  <StoreProvider<State, Actions> reducer={reducer} initialState={initialState}>
    <ConnectedFileSystemClaimsCreateScreen />
  </StoreProvider>
);
FileSystemClaimsCreateScreen.displayName = "FileSystemClaimsCreateScreen";
export default FileSystemClaimsCreateScreen;
