import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import {
  EmptyState,
  EmptyStateHeader,
  Spinner,
  EmptyStateBody,
} from "@patternfly/react-core";

export const LoadingState: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  return (
    <EmptyState>
      <EmptyStateHeader
        headingLevel="h4"
        titleText={t("Loading resources...")}
        icon={<Spinner />}
      />
      <EmptyStateBody>
        {t("You will be able to continue once the resources are loaded")}
      </EmptyStateBody>
    </EmptyState>
  );
};
LoadingState.displayName = "LoadingState";
