import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateActions,
  Button,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";

interface ErrorStateProps {
  message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = (props) => {
  const { message } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={t("Resources could not be loaded")}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={ExclamationCircleIcon} />}
      />
      <EmptyStateBody>
        {t("Please check your configuration")}
        <br />
        <pre>{message}</pre>
      </EmptyStateBody>
      <EmptyStateActions>
        <Button variant="link" onClick={handleReloadPage}>
          {t("Refresh")}
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
};
ErrorState.displayName = "ErrorState";

const handleReloadPage = () => {
  window.location.reload();
};
