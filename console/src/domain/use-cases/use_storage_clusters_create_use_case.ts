import { useCallback } from "react";
import { useStorageClustersRepository } from "@/data/repositories/use_storage_clusters_repository";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import { useRedirectHandler } from "@/shared/utils/use_redirect_handler";
import { useLocalizationService } from "@/ui/services/use_localization_service";

export const useStorageClustersCreateUseCase = () => {
  const [, dispatch] = useStore<State, Actions>();
  const { t } = useLocalizationService();
  const goToFileSystemClaimsHome = useRedirectHandler(
    "/fusion-access/file-system-claims",
  );
  const storageClustersRepository = useStorageClustersRepository();

  return useCallback(async () => {
    dispatch({
      type: "global/updateCta",
      payload: { isLoading: true },
    });

    try {
      await storageClustersRepository.create();
      goToFileSystemClaimsHome();
    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("An error occurred while creating resources"),
          description,
          variant: "danger",
        },
      });
    }
    dispatch({
      type: "global/updateCta",
      payload: { isLoading: false },
    });
  }, [dispatch, goToFileSystemClaimsHome, t, storageClustersRepository.create]);
};
