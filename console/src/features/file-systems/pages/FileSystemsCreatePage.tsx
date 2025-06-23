import { StoreProvider, useStore } from "@/shared/store/provider";
import { reducer, initialState } from "@/shared/store/reducer";
import { ListPage } from "@/shared/components/ListPage";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { FormContextProvider } from "@patternfly/react-core";
import type { State, Actions } from "@/shared/store/types";
import { FileSystemCreateForm } from "../components/FileSystemCreateForm";

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
  const [store, dispatch] = useStore<State, Actions>();
  const { t } = useFusionAccessTranslations();

  return (
    <ListPage
      documentTitle={t("Create file system")}
      title={t("Create file system")}
      description={t(
        "Create a file system to represent your required storage (based on the selected nodes’ storage)."
      )}
      alert={store.alert}
      onDismissAlert={() => dispatch({ type: "dismissAlert" })}
    >
      <FileSystemCreateForm />
    </ListPage>
  );
};
ConnectedCreateFileSystems.displayName = "ConnectedCreateFileSystems";
