import {
  MINIMUM_AMOUNT_OF_SHARED_DISKS,
  MINIMUM_AMOUNT_OF_NODES,
  MIN_AMOUNT_OF_NODES_MSG_DIGEST,
  MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL,
  MINIMUM_AMOUNT_OF_NODES_LITERAL,
} from "@/constants";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useEffect } from "react";
import type { NodesSelectionTableViewModel } from "./useNodesSelectionTableViewModel";

export const useValidateMinimumRequirements = (
  vm: NodesSelectionTableViewModel
) => {
  const [, dispatch] = useStore<State, Actions>();
  const { t } = useFusionAccessTranslations();

  useEffect(() => {
    if (!vm.loaded) {
      return;
    }

    const conditions: boolean[] = [
      vm.sharedDisksCount < MINIMUM_AMOUNT_OF_SHARED_DISKS,
      vm.selectedNodes.length < MINIMUM_AMOUNT_OF_NODES,
    ];

    if (conditions.some(Boolean)) {
      dispatch({
        type: "global/updateCta",
        payload: { isDisabled: true },
      });
      dispatch({
        type: "global/showAlert",
        payload: {
          key: MIN_AMOUNT_OF_NODES_MSG_DIGEST,
          variant: "warning",
          title: t("Storage cluster requirements"),
          description: [
            conditions[0]
              ? t(
                  "Selected nodes must share at least {{MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL}} disk",
                  { MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL }
                )
              : "",
            conditions[1]
              ? t(
                  "At least {{MINIMUM_AMOUNT_OF_NODES_LITERAL}} nodes must be selected.",
                  {
                    MINIMUM_AMOUNT_OF_NODES_LITERAL,
                  }
                )
              : "",
          ].filter(Boolean),
          isDismissable: false,
        },
      });
    } else {
      dispatch({
        type: "global/updateCta",
        payload: { isDisabled: false },
      });
      dispatch({
        type: "global/dismissAlert",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, vm.loaded, vm.selectedNodes.length, vm.sharedDisksCount]);
};
