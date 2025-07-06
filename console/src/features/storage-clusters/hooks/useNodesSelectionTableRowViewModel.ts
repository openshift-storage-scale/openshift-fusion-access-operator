import { useCallback, useMemo, useState } from "react";
import { k8sPatch, useK8sModel } from "@openshift-console/dynamic-plugin-sdk";
import {
  STORAGE_ROLE_LABEL,
  MINIMUM_AMOUNT_OF_MEMORY_GIB,
  VALUE_NOT_AVAILABLE,
} from "@/constants";
import type {
  IoK8sApimachineryPkgApiResourceQuantity,
  IoK8sApiCoreV1Node,
} from "@/shared/types/kubernetes/1.30/types";
import {
  hasLabel,
  getName,
  getUid,
} from "@/shared/utils/console/K8sResourceCommon";
import {
  getRole,
  getCpu,
  getMemory,
  toggleNodeStorageRoleLabel,
} from "@/shared/utils/kubernetes/1.30/IoK8sApiCoreV1Node";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";

export interface NodesSelectionTableRowViewModel {
  uid: string | undefined;
  name: string | undefined;
  role: string | undefined;
  cpu: IoK8sApimachineryPkgApiResourceQuantity | undefined;
  memory: string;
  status: "selected" | "selection-pending" | "unselected";
  warnings: Set<"InsufficientMemory">;
  handleNodeSelectionChange: (
    event: React.FormEvent<HTMLInputElement>,
    checked: boolean
  ) => Promise<void>;
}

export const useNodesSelectionTableRowViewModel = (
  node: IoK8sApiCoreV1Node
): NodesSelectionTableRowViewModel => {
  const [, dispatch] = useStore<State, Actions>();

  const { t } = useFusionAccessTranslations();

  const [status, setStatus] = useState<
    NodesSelectionTableRowViewModel["status"]
  >(hasLabel(node, STORAGE_ROLE_LABEL) ? "selected" : "unselected");

  const warnings = useMemo(() => new Set<"InsufficientMemory">(), []);
  const name = getName(node);
  const uid = getUid(node);
  const role = getRole(node);
  const cpu = getCpu(node);
  const value = getMemory(node);
  if (
    !(value instanceof Error) &&
    value.to("GiB") < MINIMUM_AMOUNT_OF_MEMORY_GIB
  ) {
    warnings.add("InsufficientMemory");
  }

  const memory =
    value instanceof Error
      ? VALUE_NOT_AVAILABLE
      : value.to("best", "imperial").toString(2);

  const [k8sNode] = useK8sModel({
    version: "v1",
    kind: "Node",
  });

  const handleNodeSelectionChange = useCallback<
    NodesSelectionTableRowViewModel["handleNodeSelectionChange"]
  >(
    async (_, checked) => {
      if (status === "selection-pending") {
        return;
      }

      try {
        setStatus("selection-pending");
        await k8sPatch({
          data: [
            {
              op: "replace",
              path: "/metadata/labels",
              value: toggleNodeStorageRoleLabel(node, checked),
            },
          ],
          model: k8sNode,
          resource: node,
        });
        setStatus(checked ? "selected" : "unselected");
      } catch (e) {
        setStatus(
          hasLabel(node, STORAGE_ROLE_LABEL) ? "selected" : "unselected"
        );
        dispatch({
          type: "global/addAlert",
          payload: {
            title: t("Failed to update node selection"),
            description: e instanceof Error ? e.message : String(e),
            variant: "danger",
          },
        });
      }
    },
    [dispatch, k8sNode, node, status, t]
  );

  return useMemo(
    () => ({
      name,
      uid,
      role,
      cpu,
      memory,
      status,
      warnings,
      handleNodeSelectionChange,
    }),
    [cpu, handleNodeSelectionChange, memory, name, role, status, uid, warnings]
  );
};
