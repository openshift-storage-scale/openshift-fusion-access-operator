import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon, FolderIcon } from "@patternfly/react-icons";
import { LEARN_MORE_LINK } from "@/constants";
import { useRedirectHandler } from "@/shared/utils/use_redirect_handler";
import { useLocalizationService } from "@/ui/services/use_localization_service";
import { FileSystemClaimsCreateButton } from "./file_system_claims_create_button";

export const FileSystemClaimsTableEmptyState: React.FC = () => {
  const { t } = useLocalizationService();
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
          <FileSystemClaimsCreateButton
            onClick={goToFileSystemClaimsCreateScreen}
          />
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
