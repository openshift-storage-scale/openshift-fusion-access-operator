import { useStorageClustersRepository } from "@/data/repositories/use_storage_clusters_repository";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";

export const useFileSystemClaimsCreateScreenViewModel = () => {
  const storageClustersRepository = useStorageClustersRepository();
  const [store] = useStore<State, Actions>();
  const { t } = useFusionAccessTranslations();
  const goToFileSystemClaimsHomeScreen = useRedirectHandler(
    "/fusion-access/file-system-claims",
  );
  return {
    storageClusterHasNotBeenCreated:
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
  };
};
