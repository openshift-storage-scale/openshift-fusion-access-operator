import { useMemo } from "react";
import { useDocLinksBuildUseCase } from "@/domain/use-cases/use_docs_build_use_case";

/**
 * UI-facing hook that hides the domain use-case behind a simpler API tailor-made
 * for "Learn more" links in empty states. It returns the resolved href alongside
 * loading and error flags so components can render placeholders if needed.
 */
export const useDocLinksViewModel = () => {
  const { buildDocsUrlFromClusterVersion, loaded, error } =
    useDocLinksBuildUseCase();

  const learnMoreHref = useMemo(
    () => buildDocsUrlFromClusterVersion(),
    [buildDocsUrlFromClusterVersion],
  );

  return {
    learnMoreHref,
    loaded,
    error,
  };
};
