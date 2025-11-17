import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
} from "@patternfly/react-core";
import {
  ExternalLinkAltIcon,
  StorageDomainIcon,
} from "@patternfly/react-icons";
import React from "react";
import { useLocalizationService } from "@/domain/services/use_localization_service";
import { StorageClustersCreateButton } from "@/ui/storage-clusters/views/storage_clusters_create_button";
import { useDocLinksViewModel } from "@/ui/view-models/use_docs_link_view_model";

interface StorageClusterEmptyStateProps {
  onCreateStorageCluster: React.MouseEventHandler<HTMLButtonElement>;
}

export const StorageClusterEmptyState: React.FC<
  StorageClusterEmptyStateProps
> = (props) => {
  const { onCreateStorageCluster } = props;
  const { t } = useLocalizationService();
  const { learnMoreHref } = useDocLinksViewModel();

  return (
    <EmptyState
      titleText={t("No storage cluster")}
      headingLevel="h4"
      icon={StorageDomainIcon}
    >
      <EmptyStateBody>
        {t(
          "You need to create a storage cluster before you'll be able to create file systems.",
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <StorageClustersCreateButton onClick={onCreateStorageCluster} />
        </EmptyStateActions>
        <EmptyStateActions>
          {learnMoreHref && (<Button
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

StorageClusterEmptyState.displayName = "StorageClusterEmptyState";
