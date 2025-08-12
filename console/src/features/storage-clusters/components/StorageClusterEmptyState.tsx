import React from "react";
import {
  EmptyState,
  EmptyStateBody,
  Button,
  EmptyStateFooter,
  EmptyStateActions,
} from "@patternfly/react-core";
import {
  StorageDomainIcon,
  ExternalLinkAltIcon,
} from "@patternfly/react-icons";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { StorageClustersCreateButton } from "@/features/storage-clusters/components/StorageClustersCreateButton";
import { LEARN_MORE_LINK } from "@/constants";

interface StorageClusterEmptyStateProps {
  onCreateStorageCluster: React.MouseEventHandler<HTMLButtonElement>;
}

export const StorageClusterEmptyState: React.FC<
  StorageClusterEmptyStateProps
> = (props) => {
  const { onCreateStorageCluster } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <EmptyState
      titleText={t("No storage cluster")}
      headingLevel="h4"
      icon={StorageDomainIcon}
    >
      <EmptyStateBody>
        {t(
          "You need to create a storage cluster before you'll be able to create file systems."
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <StorageClustersCreateButton onClick={onCreateStorageCluster} />
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

StorageClusterEmptyState.displayName = "StorageClusterEmptyState";
