import { ExclamationCircleIcon } from "@patternfly/react-icons";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button/Button";
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  Spinner,
} from "@patternfly/react-core";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type React from "react";

interface Descriptable {
  title: React.ReactNode;
  description: React.ReactNode;
}

interface ResourceStatusBoundaryProps extends Partial<Descriptable> {
  loaded: boolean;
  error: Error | null;
  actions?: ErrorFallbackProps["actions"];
}

/**
 * A React component that acts as a boundary for resource loading and error states.
 *
 * @param props - The component props.
 * @param props.loaded - Indicates whether the resource has finished loading.
 * @param props.error - An error object or message if the resource failed to load.
 * @param props.children - The content to render when the resource is loaded and there is no error.
 *
 * @returns Renders a loading fallback while loading, an error fallback if there is an error,
 *          or the children when loaded successfully.
 */
export const ResourceStatusBoundary: React.FC<ResourceStatusBoundaryProps> = (
  props
) => {
  const { loaded, error, actions, title, description, children } = props;

  if (!loaded) {
    return <LoadingFallback title={title} description={description} />;
  }

  if (error) {
    return (
      <ErrorFallback
        title={error}
        description={description}
        actions={actions}
      />
    );
  }

  return <>{children}</>;
};
ResourceStatusBoundary.displayName = "ResourceStatusBoundary";

type LoadingFallbackProps = Descriptable;

/**
 * Displays a loading state using an empty state layout with a spinner icon.
 *
 * @remarks
 * This component is typically used to indicate that resources are being loaded and the user must wait.
 * It uses translations for the default title and description, but both can be overridden via props.
 *
 * @param props - The props for the LoadingState component.
 * @param props.title - Optional custom title to display in the loading state. Defaults to a translated "Loading resources..." string.
 * @param props.description - Optional custom description to display below the title. Defaults to a translated message about waiting for resources to load.
 *
 * @returns A React element displaying a loading spinner and message.
 */
const LoadingFallback: React.FC<LoadingFallbackProps> = (props) => {
  const { t } = useFusionAccessTranslations();

  const {
    title = t("Loading resources..."),
    description = t(
      "You will be able to continue once the resources are loaded"
    ),
  } = props;

  return (
    <EmptyState>
      <EmptyStateHeader
        headingLevel="h4"
        titleText={title}
        icon={<Spinner />}
      />
      <EmptyStateBody>{description}</EmptyStateBody>
    </EmptyState>
  );
};
LoadingFallback.displayName = "LoadingFallback";

interface ErrorFallbackProps extends Descriptable {
  actions?: Array<Pick<ButtonProps, "onClick" | "variant"> & { text: string }>;
}

/**
 * Displays an error state with a customizable title, description, message, and actions.
 *
 * @param props - The properties for the ErrorState component.
 * @param props.message - The detailed error message to display in a preformatted block.
 * @param props.title - The title of the error state. Defaults to a translated "Resources could not be loaded".
 * @param props.description - The description of the error state. Defaults to a translated "Please check your configuration".
 * @param props.actions - An array of action objects to render as buttons. Each action should have a `variant`, `onClick` handler, and `text`. Defaults to a single "Refresh" link.
 *
 * @returns A React element displaying the error state with the provided information and actions.
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = (props) => {
  const { t } = useFusionAccessTranslations();

  const {
    title = t("Resources could not be loaded"),
    description = t("Please check your configuration"),
    actions = [
      { variant: "link", onClick: window.location.reload, text: t("Refresh") },
    ],
  } = props;

  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={title}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={ExclamationCircleIcon} />}
      />
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
ErrorFallback.displayName = "ErrorFallback";
