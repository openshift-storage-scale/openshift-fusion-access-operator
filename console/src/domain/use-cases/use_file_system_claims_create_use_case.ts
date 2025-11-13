import { useCallback } from "react";
import { useFileSystemClaimsRepository } from "@/data/repositories/use_file_system_claims_repository";
import type { Lun } from "@/domain/models/lun";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import { useRedirectHandler } from "@/shared/utils/use_redirect_handler";
import { useLocalizationService } from "@/ui/services/use_localization_service";

export const useFileSystemClaimsCreateUseCase = (
  fileSystemName: string,
  luns: Lun[],
) => {
  const [, dispatch] = useStore<State, Actions>();
  const { t } = useLocalizationService();
  const goToFileSystemClaimsHome = useRedirectHandler(
    "/fusion-access/file-system-claims",
  );
  const fileSystemClaimsRepository = useFileSystemClaimsRepository();

  return useCallback(async () => {
    dispatch({
      type: "global/updateCta",
      payload: { isLoading: true },
    });

    try {
      const devices = luns.filter((l) => l.isSelected).map((l) => l.path);
      await fileSystemClaimsRepository.create(fileSystemName, devices);
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
    } finally {
      dispatch({
        type: "global/updateCta",
        payload: { isLoading: false },
      });
    }
  }, [
    dispatch,
    fileSystemClaimsRepository.create,
    fileSystemName,
    goToFileSystemClaimsHome,
    t,
    luns.filter,
  ]);
};
