import { StoreProvider, useStore } from "@/shared/store/provider";
import { reducer, initialState } from "@/shared/store/reducer";
import { ListPage } from "@/shared/components/ListPage";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { Button, FormContextProvider, Split } from "@patternfly/react-core";
import type { State, Actions } from "@/shared/store/types";
import { FileSystemCreateForm } from "../components/FileSystemCreateForm";
import { FileSystemsCreateButton } from "../components/FileSystemsCreateButton";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";

const FileSystemsCreate: React.FC = () => {
  return (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <FormContextProvider>
        <ConnectedCreateFileSystems />
      </FormContextProvider>
    </StoreProvider>
  );
};
FileSystemsCreate.displayName = "FileSystemsCreate";
export default FileSystemsCreate;

const ConnectedCreateFileSystems: React.FC = () => {
  const [store] = useStore<State, Actions>();

  const { t } = useFusionAccessTranslations();

  const redirectToFilesystemsHome = useRedirectHandler(
    "/fusion-access/file-systems"
  );

  return (
    <ListPage
      documentTitle={t("Fusion Access for SAN")}
      title={t("Create file system claim")}
      description={t(
        "Create a file system claim to represent your required storage (based on the selected nodes’ storage)."
      )}
      alerts={store.alerts}
      footer={
        <Split hasGutter>
          <FileSystemsCreateButton
            type="submit"
            form="file-system-create-form"
            {...store.cta}
          />
          <Button variant="link" onClick={redirectToFilesystemsHome}>
            {t("Cancel")}
          </Button>
        </Split>
      }
    >
      <FileSystemCreateForm />
    </ListPage>
  );
};
ConnectedCreateFileSystems.displayName = "ConnectedCreateFileSystems";
