interface AsyncProps<
  ErrorFallbackProps extends { error: Error | null } = { error: Error | null },
> {
  loaded: boolean;
  error: Error | null;
  renderErrorFallback: React.FC<ErrorFallbackProps>;
  renderLoadingFallback: React.FC;
}

/**
 * A React component that lets you specify loading and error fallback components similar to React Suspense.
 *
 * @param props - The properties for the Async component.
 * @param props.loaded - Indicates whether the asynchronous operation has completed.
 * @param props.error - An error object indicating an error occurred during the asynchronous operation.
 * @param props.renderLoadingFallback - The fallback React node to display while loading.
 * @param props.renderErrorFallback - The fallback React node to display if an error occurs.
 * @param props.children - The content to render when loading is complete and there is no error.
 *
 * @remarks
 * - If `loaded` is false, the `LoadingFallback` is rendered.
 * - If `error` is truthy, the `ErrorFallback` is rendered.
 * - Otherwise, the `children` are rendered.
 */
export const Async: React.FC<AsyncProps> = (props) => {
  const {
    loaded,
    error,
    renderLoadingFallback,
    renderErrorFallback,
    children,
  } = props;

  if (!loaded) {
    return renderLoadingFallback({});
  }

  if (error) {
    return renderErrorFallback({ error });
  }

  return <>{children}</>;
};
Async.displayName = "Async";
