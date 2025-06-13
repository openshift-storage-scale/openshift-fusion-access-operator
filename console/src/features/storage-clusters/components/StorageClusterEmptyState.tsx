import React from "react";
import {
  EmptyState as PFEmptyState,
  EmptyStateBody,
  Button,
  EmptyStateFooter,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateIcon,
} from "@patternfly/react-core";
import {
  StorageDomainIcon,
  ExternalLinkAltIcon,
} from "@patternfly/react-icons";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { StorageClustersCreateButton } from "@/features/storage-clusters/components/StorageClustersCreateButton";

interface StorageClusterEmptyStateProps {
  onCreateStorageCluster: React.MouseEventHandler<HTMLButtonElement>;
  learnMoreHref?: string;
}

export const StorageClusterEmptyState: React.FC<
  StorageClusterEmptyStateProps
> = (props) => {
  const { onCreateStorageCluster, learnMoreHref = "" } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <PFEmptyState>
      <EmptyStateHeader
        titleText={t("No storage cluster")}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={StorageDomainIcon} />}
      />
      <EmptyStateBody>
        {t(
          "You need to create a storage cluster before you'll be able to create file systems."
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <StorageClustersCreateButton
            onCreateStorageCluster={onCreateStorageCluster}
          />
        </EmptyStateActions>
        <EmptyStateActions>
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
        </EmptyStateActions>
      </EmptyStateFooter>
    </PFEmptyState>
  );
};

StorageClusterEmptyState.displayName = "StorageClusterEmptyState";
