import type { NavPage } from "@openshift-console/dynamic-plugin-sdk";
import { useMemo } from "react";
import { useFileSystemClaimsRepository } from "@/data/repositories/use_file_system_claims_repository";
import { useStorageClustersRepository } from "@/data/repositories/use_storage_clusters_repository";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import { useRedirectHandler } from "@/shared/utils/use_redirect_handler";
import { useLocalizationService } from "@/ui/services/use_localization_service";
import { FileSystemClaimsTable } from "../views/file_system_claims_table";

export const useFileSystemClaimsHomeScreenViewModel = () => {
  const fileSystemClaimsRepository = useFileSystemClaimsRepository();
  const storageClustersRepository = useStorageClustersRepository();

  const { t } = useLocalizationService();
  const [store] = useStore<State, Actions>();
  const goToFileSystemClaimsCreateScreen = useRedirectHandler(
    "/fusion-access/file-system-claims/create",
  );
  const goToStorageClustersHome = useRedirectHandler(
    "/fusion-access/storage-cluster",
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

  return useMemo(
    () => ({
      pages,
      loaded:
        fileSystemClaimsRepository.loaded && storageClustersRepository.loaded,
      error:
        fileSystemClaimsRepository.error || storageClustersRepository.error,
      alerts: store.alerts,
      documentTitle: t("Fusion Access for SAN"),
      title: t("Fusion Access for SAN"),
      fileSystemClaims: fileSystemClaimsRepository.fileSystemClaims,
      storageClusters: storageClustersRepository.storageClusters,
      goToFileSystemClaimsCreateScreen,
      goToStorageClustersHome,
    }),
    [
      fileSystemClaimsRepository.loaded,
      fileSystemClaimsRepository.error,
      storageClustersRepository.loaded,
      storageClustersRepository.error,
      store.alerts,
      t,
      fileSystemClaimsRepository.fileSystemClaims,
      storageClustersRepository.storageClusters,
      goToFileSystemClaimsCreateScreen,
      pages,
      goToStorageClustersHome,
    ],
  );
};
