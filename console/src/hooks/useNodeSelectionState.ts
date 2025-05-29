import { useState, useMemo } from "react";
import {
  MINIMUM_AMOUNT_OF_MEMORY_GIB,
  STORAGE_ROLE_LABEL,
  VALUE_NOT_AVAILABLE,
} from "@/constants";
import type {
  IoK8sApimachineryPkgApiResourceQuantity,
  IoK8sApiCoreV1Node,
} from "@/models/kubernetes/1.30/types";
import { hasLabel, getUid, getName } from "@/utils/console/K8sResourceCommon";
import {
  type NodeRoles,
  getMemory,
  getRole,
  getCpu,
} from "@/utils/kubernetes/1.30/IoK8sApiCoreV1Node";

export interface NodeSelectionState {
  uid: string;
  name: string;
  role: NodeRoles;
  cpu: IoK8sApimachineryPkgApiResourceQuantity;
  memory: IoK8sApimachineryPkgApiResourceQuantity;
  hasMemoryWarning: boolean;
  isSelected: boolean;
  isSelectionPending: boolean;
}

export interface NodeSelectionActions {
  setSelectionPending: (checked: boolean) => void;
  setSelectionSucceeded: (checked: boolean) => void;
  setSelectionFailed: (hasStorageRoleLabel: boolean) => void;
}

export const useNodeSelectionState = (
  node: IoK8sApiCoreV1Node
): [NodeSelectionState, NodeSelectionActions] => {
  const isSelected = hasLabel(node, STORAGE_ROLE_LABEL);
  const [memoryValue] = getMemory(node, "GiB");
  let memory = "";
  let hasMemoryWarning = true;
  
  if (!memoryValue) {
    memory = VALUE_NOT_AVAILABLE;
    hasMemoryWarning = true;
  } else {
    memory = memoryValue.toFixed(2);
    hasMemoryWarning = memoryValue < MINIMUM_AMOUNT_OF_MEMORY_GIB;
  }

  const [state, setState] = useState<NodeSelectionState>({
    uid: getUid(node) ?? VALUE_NOT_AVAILABLE,
    name: getName(node) ?? VALUE_NOT_AVAILABLE,
    role: getRole(node) ?? VALUE_NOT_AVAILABLE,
    cpu: getCpu(node) ?? VALUE_NOT_AVAILABLE,
    memory,
    hasMemoryWarning,
    isSelected,
    isSelectionPending: false,
  });

  const actions = useMemo(
    () => ({
      setSelectionPending: (checked: boolean) => {
        setState((s) => ({
          ...s,
          isSelectionPending: true,
          isSelected: checked,
        }));
      },
      setSelectionSucceeded: (checked: boolean) => {
        setState((s) => ({
          ...s,
          isSelectionPending: false,
          isSelected: checked,
        }));
      },
      setSelectionFailed: (hasStorageRoleLabel: boolean) => {
        setState((s) => ({
          ...s,
          isSelectionPending: false,
          isSelected: hasStorageRoleLabel,
        }));
      },
    }),
    []
  );

  return [state, actions];
};
