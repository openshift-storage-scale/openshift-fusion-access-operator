import { STORAGE_ROLE_LABEL } from "@/constants";
import type { IoK8sApiCoreV1Node } from "@/models/kubernetes/1.30/types";
import type { NodesSelectionTableRowViewModel } from "@/view-models/NodesSelectionTableRowViewModel";
import { getUid, hasLabel } from "@/utils/console/K8sResourceCommon";
import { toggleNodeStorageRoleLabel } from "@/utils/kubernetes/1.30/IoK8sApiCoreV1Node";
import { useK8sModel, k8sPatch } from "@openshift-console/dynamic-plugin-sdk";
import { useCallback } from "react";

export type NodeSelectionChangeHandler = (
  node: NodesSelectionTableRowViewModel
) => (event: React.FormEvent<HTMLInputElement>, checked: boolean) => void;

export const useNodeSelectionChangeHandler = (
  nodes: IoK8sApiCoreV1Node[]
): NodeSelectionChangeHandler => {
  const [k8sNode, _] = useK8sModel({
    version: "v1",
    kind: "Node",
  });

  return useCallback<NodeSelectionChangeHandler>(
    (nodeModel) => async (_, checked) => {
      if (nodeModel.status === "selection-pending") {
        return;
      }

      const node = nodes.find((n) => getUid(n) === nodeModel.uid);
      if (!node) {
        return;
      }

      try {
        nodeModel.status = "selection-pending";
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
        nodeModel.status = checked ? "selected" : "unselected";
      } catch (_) {
        nodeModel.status = hasLabel(node, STORAGE_ROLE_LABEL)
          ? "selected"
          : "unselected";
      }
    },
    [k8sNode, nodes]
  );
};
