import convert, { type Unit } from "convert";
import type { IoK8sApiCoreV1Node } from "@/models/kubernetes/1.30/types";
import { hasLabel } from "@/utils/console/K8sResourceCommon";
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

export const getMemory = (
  node: IoK8sApiCoreV1Node,
  displayUnit: Extract<"B" | `${SuffixBinarySI | SuffixDecimalSI}B`, Unit>
): [number, null] | [null, Error] => {
  if (!node.status?.capacity?.memory) {
    return [null, new Error("node's memory is not available")];
  }

  const [quantity, parseQuantityError] = parseQuantity(node.status.capacity.memory);
  if (parseQuantityError) {
    return [null, parseQuantityError];
  }

  let adaptedValue: number = quantity.value;
  let adaptedUnit: Extract<"B" | `${SuffixBinarySI | SuffixDecimalSI}B`, Unit>;
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

  const value = convert(adaptedValue, adaptedUnit).to(displayUnit);
  return [value, null];
};

export const getCpu = (node: IoK8sApiCoreV1Node) => node.status?.capacity?.cpu;

export const getSelectedNodes = (nodes: IoK8sApiCoreV1Node[]) =>
  nodes.filter((n) => hasLabel(n, STORAGE_ROLE_LABEL));
