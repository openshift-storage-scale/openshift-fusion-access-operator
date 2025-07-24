import { EmptyState, EmptyStateBody, Spinner } from "@patternfly/react-core";
import { useFusionAccessTranslations } from "../hooks/useFusionAccessTranslations";


export const DefaultLoadingFallback: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const title = t("Loading resources...");
  const description = t(
    "You will be able to continue once the resources are loaded"
  );

  return (
    <EmptyState icon={Spinner} titleText={title} headingLevel="h4">
      <EmptyStateBody>{description}</EmptyStateBody>
    </EmptyState>
  );
};
DefaultLoadingFallback.displayName = "DefaultLoadingFallback";
