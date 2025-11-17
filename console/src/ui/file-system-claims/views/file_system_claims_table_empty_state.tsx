import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateFooter,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon, FolderIcon } from "@patternfly/react-icons";
import { useLocalizationService } from "@/domain/services/use_localization_service";
import { useRedirectHandler } from "@/shared/utils/use_redirect_handler";
import { useDocLinksViewModel } from "@/ui/view-models/use_docs_link_view_model";
import { FileSystemClaimsCreateButton } from "./file_system_claims_create_button";

export const FileSystemClaimsTableEmptyState: React.FC = () => {
  const { t } = useLocalizationService();
  const goToFileSystemClaimsCreateScreen = useRedirectHandler(
    "/fusion-access/file-system-claims/create",
  );
  const { learnMoreHref } = useDocLinksViewModel();

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
          {learnMoreHref && (
            <Button
              component="a"
              variant="link"
              target="_blank"
              rel="noopener noreferrer"
              href={learnMoreHref}
            >
              {t("Learn more about Fusion Access for SAN storage clusters")}{" "}
              <ExternalLinkAltIcon />
            </Button>
          )}
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};
FileSystemClaimsTableEmptyState.displayName = "FileSystemClaimsTableEmptyState";
