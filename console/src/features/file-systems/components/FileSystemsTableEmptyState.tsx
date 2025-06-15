import { FILE_SYSTEMS_CREATE_URL_PATH } from "@/constants";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon, FolderIcon } from "@patternfly/react-icons";
import { useCallback } from "react";
import { useHistory } from "react-router";
import { FileSystemsCreateButton } from "./FileSystemsCreateButton";

export const FileSystemsTableEmptyState: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const histroy = useHistory();
  const handleCreateFileSystem = useCallback(() => {
    histroy.push(FILE_SYSTEMS_CREATE_URL_PATH);
  }, [histroy]);

  return (
    <EmptyState
      titleText={t("No file systems")}
      headingLevel="h4"
      icon={FolderIcon}
    >
      <EmptyStateBody>
        {t("You can create one by pressing the button below.")}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <FileSystemsCreateButton
            onCreateFileSystem={handleCreateFileSystem}
          />
        </EmptyStateActions>
        <EmptyStateActions>
          <Button
            component="a"
            variant="link"
            target="_blank"
            rel="noopener noreferrer"
            href="#"
          >
            {t("Learn more about Fusion Access for SAN storage clusters")}{" "}
            <ExternalLinkAltIcon />
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};
FileSystemsTableEmptyState.displayName = "FileSystemsTableEmptyState";
