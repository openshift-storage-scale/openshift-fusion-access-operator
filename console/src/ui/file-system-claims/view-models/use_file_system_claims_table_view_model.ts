import { type TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchFileSystemClaim } from "@/shared/hooks/useWatchFileSystemClaim";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";

export const useFileSystemClaimsTableViewModel = () => {
  const { t } = useFusionAccessTranslations();

  const columns: TableColumn<FileSystemClaim>[] = useMemo(
    () => [
      {
        id: "name",
        title: t("Name"),
      },
      {
        id: "status",
        title: t("Status"),
      },
      {
        id: "raw-capacity",
        title: t("Raw capacity"),
      },
      {
        id: "dashboard-link",
        title: t("Dashboard link"),
        props: { className: "pf-v6-u-text-align-center" },
      },
    ],
    [t],
  );

  const fileSystemClaimsResult = useWatchFileSystemClaim();

  return useMemo(
    () =>
      ({
        columns,
        loaded: fileSystemClaimsResult.loaded,
        error: fileSystemClaimsResult.error,
        fileSystemClaims: fileSystemClaimsResult.data ?? [],
      }) as const,
    [columns, fileSystemClaimsResult],
  );
};
