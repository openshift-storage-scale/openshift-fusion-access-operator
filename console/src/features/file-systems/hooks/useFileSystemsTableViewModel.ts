import { type TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchFileSystem } from "@/shared/hooks/useWatchFileSystem";
import { useWatchFileSystemClaim } from "@/shared/hooks/useWatchFileSystemClaim";
import type { Filesystem } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Filesystem";

export const useFileSystemsTableViewModel = () => {
  const { t } = useFusionAccessTranslations();

  const columns: TableColumn<Filesystem>[] = useMemo(
    () => [
      {
        id: "name",
        title: t("Name"),
        props: { className: "pf-v6-u-w-25" },
      },
      {
        id: "status",
        title: t("Status"),
        props: { className: "pf-v6-u-w-10" },
      },
      {
        id: "raw-capacity",
        title: t("Raw capacity"),
        props: { className: "pf-v6-u-w-10" },
      },
      {
        id: "dashboard-link",
        title: t("Dashboard link"),
        props: { className: "pf-v6-u-w-10 pf-v6-u-text-align-center" },
      },
    ],
    [t],
  );

  const fileSystemClaimsResult = useWatchFileSystemClaim();
  const fileSystemsResult = useWatchFileSystem();

  return useMemo(
    () =>
      ({
        columns,
        loaded: fileSystemClaimsResult.loaded && fileSystemsResult.loaded,
        error: fileSystemClaimsResult.error || fileSystemsResult.error,
        fileSystems: fileSystemsResult.data ?? [],
        fileSystemClaims: fileSystemClaimsResult.data ?? [],
      }) as const,
    [columns, fileSystemClaimsResult, fileSystemsResult],
  );
};

export type FileSystemsTableViewModel = ReturnType<
  typeof useFileSystemsTableViewModel
>;
