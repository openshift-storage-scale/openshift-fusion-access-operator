import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
} from "@patternfly/react-core";
import { type ButtonProps } from "@patternfly/react-core/dist/js/components/Button/Button";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { useFusionAccessTranslations } from "../hooks/useFusionAccessTranslations";

interface DefaultErrorFallback {
  error: Error | null;
}

export const DefaultErrorFallback: React.FC<DefaultErrorFallback> = (props) => {
  const { t } = useFusionAccessTranslations();

  const { error } = props;

  const title = t("Resources could not be loaded");
  const description = error?.message ?? t("Please check your configuration");
  const actions: Array<
    Pick<ButtonProps, "onClick" | "variant"> & { text: string }
  > = [
    { variant: "link", onClick: () => window.location.reload(), text: t("Refresh") },
  ];

  return (
    <EmptyState
      titleText={title}
      headingLevel="h4"
      icon={ExclamationCircleIcon}
    >
      <EmptyStateBody>{description}</EmptyStateBody>
      <EmptyStateFooter>
        {actions.map((action) => (
          <EmptyStateActions>
            <Button variant={action.variant} onClick={action.onClick}>
              {action.text}
            </Button>
          </EmptyStateActions>
        ))}
      </EmptyStateFooter>
    </EmptyState>
  );
};
DefaultErrorFallback.displayName = "DefaultErrorFallback";
