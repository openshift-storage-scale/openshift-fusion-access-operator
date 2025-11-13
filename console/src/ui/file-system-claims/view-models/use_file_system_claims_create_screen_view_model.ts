import { useMemo } from "react";
import { useStorageClustersRepository } from "@/data/repositories/use_storage_clusters_repository";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import { useRedirectHandler } from "@/shared/utils/use_redirect_handler";
import { useLocalizationService } from "@/ui/services/use_localization_service";

export const useFileSystemClaimsCreateScreenViewModel = () => {
  const storageClustersRepository = useStorageClustersRepository();
  const [store] = useStore<State, Actions>();
  const { t } = useLocalizationService();
  const goToFileSystemClaimsHomeScreen = useRedirectHandler(
    "/fusion-access/file-system-claims",
  );
  return useMemo(
    () => ({
      hasStorageClusterNotBeenCreated:
        storageClustersRepository.hasNotBeenCreated,
      alerts: store.alerts,
      cta: store.cta,
      documentTitle: t("Fusion Access for SAN"),
      title: t("Create file system claim"),
      description: t(
        "Create a file system claim to represent your required storage (based on the selected nodes' storage).",
      ),
      goToFileSystemClaimsHomeScreen,
      cancelButtonText: t("Cancel"),
      formId: "file-system-claim-create-form",
    }),
    [
      storageClustersRepository.hasNotBeenCreated,
      store.alerts,
      store.cta,
      t,
      goToFileSystemClaimsHomeScreen,
    ],
  );
};
