import { CreateFileSystemButton } from "@/components/CreateFileSystemButton";
import { FileSystemsTabbedNav } from "@/components/FileSystemsTabbedNav";
import { FusionAccessListPage } from "@/components/FusionAccessListPage";
import { StoreProvider } from "@/contexts/store/provider";
import { reducer, initialState } from "@/contexts/store/reducer";
import type { State, Actions } from "@/contexts/store/types";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";
import { useHistory } from "react-router";

const FileSystemsHome: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const history = useHistory();

  return (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <FusionAccessListPage
        documentTitle={t("Fusion Access for SAN")}
        title={t("Fusion Access for SAN")}
        actions={[
          <CreateFileSystemButton
            key="create-filesystem"
            onCreateFileSystem={() => {
              history.push("/fusion-access/file-systems/create");
            }}
          />,
        ]}
      >
        <FileSystemsTabbedNav />
      </FusionAccessListPage>
    </StoreProvider>
  );
};

FileSystemsHome.displayName = "FileSystemsHome";
export default FileSystemsHome;
