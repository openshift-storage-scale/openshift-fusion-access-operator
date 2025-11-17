import { useCallback, useMemo } from "react";
import { useClusterVersionsRepository } from "@/data/repositories/use_cluster_versions_repository";
import type { IoOpenshiftConfigV1ClusterVersion } from "@/shared/types/openshift/4.19/types";

const DEFAULT_DOCS_VERSION = "4.20";
const DOCS_URL_TEMPLATE =
  "https://docs.redhat.com/en/documentation/openshift_container_platform/{version}/html/virtualization/storage#install-configure-fusion-access-san";

export const useDocLinksBuildUseCase = () => {
  const { clusterVersion, loaded, error } = useClusterVersionsRepository();

  const parsedVersion = useMemo(
    () => parseClusterVersion(clusterVersion),
    [clusterVersion],
  );

  const docsVersion = parsedVersion
    ? `${parsedVersion.major}.${parsedVersion.minor}`
    : DEFAULT_DOCS_VERSION;

  const buildDocsUrlFromClusterVersion = useCallback(() => {
    return DOCS_URL_TEMPLATE.replace("{version}", docsVersion);
  }, [docsVersion]);

  return {
    loaded,
    error,
    clusterVersion: parsedVersion,
    buildDocsUrlFromClusterVersion,
  };
};

const parseClusterVersion = (
  clusterVersion: IoOpenshiftConfigV1ClusterVersion | null,
) => {
  const rawVersion = clusterVersion?.status?.desired?.version;
  if (typeof rawVersion !== "string") {
    return null;
  }

  const [major, minor] = rawVersion.split(".");
  if (!major || !minor) {
    return null;
  }

  return { major, minor };
};
