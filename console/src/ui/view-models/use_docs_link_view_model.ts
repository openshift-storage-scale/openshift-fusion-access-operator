import { useMemo } from "react";
import { useDocLinksBuildUseCase } from "@/domain/use-cases/use_docs_build_use_case";

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
