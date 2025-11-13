import { EmptyState, EmptyStateBody, Spinner } from "@patternfly/react-core";
import { useLocalizationService } from "../../ui/services/use_localization_service";

export const DefaultLoadingFallback: React.FC = () => {
  const { t } = useLocalizationService();

  const title = t("Loading resources...");
  const description = t(
    "You will be able to continue once the resources are loaded",
  );

  return (
    <EmptyState icon={Spinner} titleText={title} headingLevel="h4">
      <EmptyStateBody>{description}</EmptyStateBody>
    </EmptyState>
  );
};
DefaultLoadingFallback.displayName = "DefaultLoadingFallback";
