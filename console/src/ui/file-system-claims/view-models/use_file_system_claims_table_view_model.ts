import { type TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { useFileSystemClaimsRepository } from "@/data/repositories/use_file_system_claims_repository";
import { useLocalizationService } from "@/domain/services/use_localization_service";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";

export const useFileSystemClaimsTableViewModel = () => {
  const { t } = useLocalizationService();

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

  const fileSystemClaimsRepository = useFileSystemClaimsRepository();

  return useMemo(
    () =>
      ({
        columns,
        loaded: fileSystemClaimsRepository.loaded,
        error: fileSystemClaimsRepository.error,
        fileSystemClaims: fileSystemClaimsRepository.fileSystemClaims,
      }) as const,
    [columns, fileSystemClaimsRepository],
  );
};
