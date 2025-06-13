import { useCallback } from "react";
import { useK8sModel, k8sPatch } from "@openshift-console/dynamic-plugin-sdk";
import { STORAGE_ROLE_LABEL } from "@/constants";
import { getUid, hasLabel } from "@/shared/utils/console/K8sResourceCommon";
import { toggleNodeStorageRoleLabel } from "@/shared/utils/kubernetes/1.30/IoK8sApiCoreV1Node";
import type {
  NodesSelectionTableRowViewModel,
  NodesSelectionTableViewModel,
} from "./useNodesSelectionTableViewModel";
import type { IoK8sApiCoreV1Node } from "@/shared/types/kubernetes/1.30/types";

export type NodeSelectionChangeHandler = (
  node: NodesSelectionTableRowViewModel
) => (event: React.FormEvent<HTMLInputElement>, checked: boolean) => void;

export const useNodeSelectionChangeHandler = (
  vm: NodesSelectionTableViewModel,
  nodes: IoK8sApiCoreV1Node[]
): NodeSelectionChangeHandler => {
  const [k8sNode] = useK8sModel({
    version: "v1",
    kind: "Node",
  });

  return useCallback<NodeSelectionChangeHandler>(
    (nodeViewModel) => async (_, checked) => {
      if (nodeViewModel.status === "selection-pending") {
        return;
      }

      const node = nodes.find((n) => getUid(n) === nodeViewModel.uid);
      if (!node) {
        return;
      }

      try {
        vm.setNodeStatus(nodeViewModel, "selection-pending");
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
        vm.setNodeStatus(nodeViewModel, checked ? "selected" : "unselected");
      } catch (_) {
        vm.setNodeStatus(
          nodeViewModel,
          hasLabel(node, STORAGE_ROLE_LABEL) ? "selected" : "unselected"
        );
      }
    },
    [k8sNode, nodes, vm]
  );
};
