import type { NavPage } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { useFileSystemClaimsRepository } from "@/data/repositories/use_file_system_claims_repository";
import { useStorageClustersRepository } from "@/data/repositories/use_storage_clusters_repository";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import { FileSystemClaimsTable } from "../views/file_system_claims_table";

export const useFileSystemClaimsHomeScreenViewModel = () => {
  const fileSystemClaimsRepository = useFileSystemClaimsRepository();
  const storageClustersRepository = useStorageClustersRepository();

  const { t } = useFusionAccessTranslations();
  const [store] = useStore<State, Actions>();
  const goToFileSystemClaimsCreateScreen = useRedirectHandler(
    "/fusion-access/file-system-claims/create",
  );
  const pages: NavPage[] = useMemo(
    () => [
      {
        name: t("File system claims"),
        href: "",
        component: FileSystemClaimsTable,
      },
    ],
    [t],
  );

  return {
    pages,
    loaded:
      fileSystemClaimsRepository.loaded && storageClustersRepository.loaded,
    error: fileSystemClaimsRepository.error || storageClustersRepository.error,
    alerts: store.alerts,
    documentTitle: t("Fusion Access for SAN"),
    title: t("Fusion Access for SAN"),
    fileSystemClaims: fileSystemClaimsRepository.fileSystemClaims,
    storageClusters: storageClustersRepository.storageClusters,
    goToFileSystemClaimsCreateScreen,
    storageClusterHasNotBeenCreated:
      storageClustersRepository.hasNotBeenCreated,
  };
};
