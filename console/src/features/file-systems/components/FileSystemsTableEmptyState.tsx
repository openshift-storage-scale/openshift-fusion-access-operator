import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon, FolderIcon } from "@patternfly/react-icons";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";
import { FileSystemsCreateButton } from "./FileSystemsCreateButton";

export const FileSystemsTableEmptyState: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const redirectToCreateFileSystem = useRedirectHandler(
    "/fusion-access/file-systems/create"
  );

  return (
    <EmptyState
      titleText={t("No file systems")}
      headingLevel="h4"
      icon={FolderIcon}
    >
      <EmptyStateFooter>
        <EmptyStateActions>
          <FileSystemsCreateButton onClick={redirectToCreateFileSystem} />
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
