import { StoreProvider } from "@/contexts/store/provider";
import { reducer, initialState } from "@/contexts/store/reducer";
import type { State, Actions } from "@/contexts/store/types";
import { ListPage } from "@/shared/components/ListPage";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useHistory } from "react-router";
import { FileSystemsTabbedNav } from "../components/FileSystemsTabbedNav";
import { FileSystemsCreateButton } from "../components/FileSystemsCreateButton";

const FileSystemsHomePage: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const history = useHistory();

  return (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <ListPage
        documentTitle={t("Fusion Access for SAN")}
        title={t("Fusion Access for SAN")}
        actions={[
          <FileSystemsCreateButton
            key="create-filesystem"
            onCreateFileSystem={() => {
              history.push("/fusion-access/file-systems/create");
            }}
          />,
        ]}
      >
        <FileSystemsTabbedNav />
      </ListPage>
    </StoreProvider>
  );
};

FileSystemsHomePage.displayName = "FileSystemsHomePage";

export default FileSystemsHomePage;
