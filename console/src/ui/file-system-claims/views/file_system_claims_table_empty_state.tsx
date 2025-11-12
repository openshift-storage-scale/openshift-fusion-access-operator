import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon, FolderIcon } from "@patternfly/react-icons";
import { LEARN_MORE_LINK } from "@/constants";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";
import { FileSystemClaimsCreateButton } from "./file_system_claims_create_button";

export const FileSystemClaimsTableEmptyState: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const goToFileSystemClaimsCreateScreen = useRedirectHandler(
    "/fusion-access/file-system-claims/create",
  );

  return (
    <EmptyState
      titleText={t("No file system claims")}
      headingLevel="h4"
      icon={FolderIcon}
    >
      <EmptyStateFooter>
        <EmptyStateActions>
          <FileSystemClaimsCreateButton onClick={goToFileSystemClaimsCreateScreen} />
        </EmptyStateActions>
        <EmptyStateActions>
          <Button
            component="a"
            variant="link"
            target="_blank"
            rel="noopener noreferrer"
            href={LEARN_MORE_LINK}
          >
            {t("Learn more about Fusion Access for SAN storage clusters")}{" "}
            <ExternalLinkAltIcon />
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};
FileSystemClaimsTableEmptyState.displayName = "FileSystemClaimsTableEmptyState";
