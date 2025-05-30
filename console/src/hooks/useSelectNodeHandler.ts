import { useCallback } from "react";
import { k8sPatch, useK8sModel } from "@openshift-console/dynamic-plugin-sdk";
import { getLabels, hasLabel } from "@/utils/console/K8sResourceCommon";
import { STORAGE_ROLE_LABEL } from "@/constants";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";
import type { IoK8sApiCoreV1Node } from "@/models/kubernetes/1.30/types";
import { useStore } from "@/contexts/store/provider";
import { getDigest } from "@/utils/crypto/hash";
import type { NodeSelectionActions } from "@/hooks/useNodeSelectionState";
import type { State, Actions } from "@/contexts/store/types";

const [storageRoleLabelKey, storageRoleLabelValue] =
  STORAGE_ROLE_LABEL.split("=");

type SelectNodeHandler = (
  event: React.FormEvent<HTMLInputElement>,
  checked: boolean
) => void;

export type UseSelectNodeHandler = (options: {
  node: IoK8sApiCoreV1Node;
  isSelectionPending: boolean;
  nodeSelectionActions: NodeSelectionActions;
}) => SelectNodeHandler;

export const useSelectNodeHandler: UseSelectNodeHandler = ({
  node,
  isSelectionPending,
  nodeSelectionActions,
}) => {
  const [, dispatch] = useStore<State, Actions>();
  const { t } = useFusionAccessTranslations();
  const [nodeModel, _] = useK8sModel({
    version: "v1",
    kind: "Node",
  });

  return useCallback<SelectNodeHandler>(
    async (_, checked) => {
      if (isSelectionPending) {
        return;
      }

      const labels = getLabels(node);
      if (!labels) {
        return;
      }

      if (checked) {
        labels[storageRoleLabelKey] = storageRoleLabelValue;
      } else {
        if (storageRoleLabelKey in labels) {
          delete labels[storageRoleLabelKey];
        }
      }

      try {
        nodeSelectionActions.setSelectionPending(checked);
        await k8sPatch({
          data: [
            {
              op: "replace",
              path: "/metadata/labels",
              value: labels,
            },
          ],
          model: nodeModel,
          resource: node,
        });
        nodeSelectionActions.setSelectionSucceeded(checked);
      } catch (e) {
        nodeSelectionActions.setSelectionFailed(
          hasLabel(node, STORAGE_ROLE_LABEL)
        );
        const description = e instanceof Error ? e.message : (e as string);
        const descriptionDigest = await getDigest(description);
        dispatch({
          type: "addAlert",
          payload: {
            key: descriptionDigest,
            variant: "danger",
            title: t("An error occurred while selecting a node"),
            description,
            isDismissable: true,
          },
        });
      }
    },
    [isSelectionPending, node, nodeSelectionActions, nodeModel, dispatch, t]
  );
};
