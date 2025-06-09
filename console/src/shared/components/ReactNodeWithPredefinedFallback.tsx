import { ErrorState } from "@/shared/components/ErrorState";
import { LoadingState } from "@/shared/components/LoadingState";

interface ReactNodeWithPredefinedFallbackProps {
  loaded: boolean;
  error: Error | string;
}

export const ReactNodeWithPredefinedFallback: React.FC<
  ReactNodeWithPredefinedFallbackProps
> = (props) => {
  const { loaded, error, children } = props;

  if (!loaded) {
    return <LoadingState />;
  }

  if (error instanceof Error) {
    return <ErrorState message={error.message} />;
  } else if (error.length > 0) {
    return <ErrorState message={error} />;
  }

  return <>{children}</>;
};
ReactNodeWithPredefinedFallback.displayName = "ReactNodeWithPredefinedFallback";
