import convert, {
  type Converter,
  type MeasuresByUnit,
  type Unit,
} from "convert";
import type { IoK8sApiCoreV1Node } from "@/shared/types/kubernetes/1.30/types";
import { getLabels, hasLabel } from "@/shared/utils/console/K8sResourceCommon";
import type {
  SuffixBinarySI,
  SuffixDecimalSI,
} from "./IoK8sApimachineryPkgApiResourceQuantity";
import { parseQuantity } from "./IoK8sApimachineryPkgApiResourceQuantity";
import {
  CPLANE_NODE_ROLE_LABEL,
  MASTER_NODE_ROLE_LABEL,
  STORAGE_ROLE_LABEL,
  VALUE_NOT_AVAILABLE,
  WORKER_NODE_ROLE_LABEL,
} from "@/constants";

export type NodeRoles =
  | "worker"
  | "master"
  | "control-plane"
  | typeof VALUE_NOT_AVAILABLE;

export const getRole = (node: IoK8sApiCoreV1Node): NodeRoles => {
  let role: NodeRoles = VALUE_NOT_AVAILABLE;
  switch (true) {
    case hasLabel(node, `${WORKER_NODE_ROLE_LABEL}=`):
      role = "worker";
      break;
    case hasLabel(node, `${MASTER_NODE_ROLE_LABEL}=`):
      role = "master";
      break;
    case hasLabel(node, `${CPLANE_NODE_ROLE_LABEL}=`):
      role = "control-plane";
      break;
  }

  return role;
};

export const toggleNodeStorageRoleLabel = (
  node: IoK8sApiCoreV1Node,
  shouldBeSelected: boolean
): Record<string, string> => {
  const labels = getLabels(node);
  const result = structuredClone(labels);
  const [storageRoleLabelKey, storageRoleLabelValue] =
    STORAGE_ROLE_LABEL.split("=");
  if (shouldBeSelected) {
    result[storageRoleLabelKey] = storageRoleLabelValue;
  } else if (storageRoleLabelKey in result) {
    delete result[storageRoleLabelKey];
  }

  return result;
};

type ConvertableUnit = Extract<
  "B" | `${SuffixBinarySI | SuffixDecimalSI}B`,
  Unit
>;

export type ConvertableMemoryValue = Converter<
  number,
  Extract<ConvertableUnit, MeasuresByUnit<"PiB" | "PB" | "B">>
>;

export const getMemory = (
  node: IoK8sApiCoreV1Node
): ConvertableMemoryValue | Error => {
  if (!node.status?.capacity?.memory) {
    return new Error("node's memory is not available");
  }

  const quantity = parseQuantity(node.status.capacity.memory);

  if (quantity instanceof Error) {
    return quantity;
  }

  let adaptedValue: number = quantity.value;
  let adaptedUnit: ConvertableUnit;
  switch (quantity.unit) {
    case "B":
      adaptedUnit = quantity.unit;
      break;
    case "E": // unsupported by "convert"
      adaptedUnit = "PB";
      adaptedValue = quantity.value * 1000;
      break;
    case "Ei": // unsupported by "convert"
      adaptedUnit = "PiB";
      adaptedValue = quantity.value * 1024;
      break;
    default:
      adaptedUnit = (quantity.unit + "B") as `${Exclude<
        "Ei" | "E",
        SuffixBinarySI | SuffixDecimalSI
      >}B`;
      break;
  }

  return convert(adaptedValue, adaptedUnit);
};

export const getCpu = (node: IoK8sApiCoreV1Node) => node.status?.capacity?.cpu;

export const getSelectedNodes = (nodes: IoK8sApiCoreV1Node[]) =>
  nodes.filter((n) => hasLabel(n, STORAGE_ROLE_LABEL));
