import { k8sPatch, useK8sModel } from "@openshift-console/dynamic-plugin-sdk";
import convert, {
  type Converter,
  type MeasuresByUnit,
  type Unit,
} from "convert";
import { useCallback, useMemo, useState } from "react";
import {
  CPLANE_NODE_ROLE_LABEL,
  MASTER_NODE_ROLE_LABEL,
  MINIMUM_AMOUNT_OF_MEMORY_GIB,
  STORAGE_ROLE_LABEL,
  VALUE_NOT_AVAILABLE,
  WORKER_NODE_ROLE_LABEL,
} from "@/constants";
import { groupVersionKind } from "@/data/models/node_gvk";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import type { IoK8sApiCoreV1Node } from "@/shared/types/openshift/4.19/types";
import {
  getLabels,
  getName,
  getUid,
  hasLabel,
} from "@/shared/utils/k8s_resource_common";
import { useLocalizationService } from "@/ui/services/use_localization_service";

export const useStorageClusterNodesSelectionTableRowViewModel = (
  node: IoK8sApiCoreV1Node,
) => {
  const [, dispatch] = useStore<State, Actions>();
  const { t } = useLocalizationService();
  const [status, setStatus] = useState(
    hasLabel(node, STORAGE_ROLE_LABEL) ? "selected" : "unselected",
  );
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

  const [model] = useK8sModel(groupVersionKind);

  const handleNodeSelectionChange = useCallback(
    async (_: React.FormEvent<HTMLInputElement>, checked: boolean) => {
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
          model: model,
          resource: node,
        });
        setStatus(checked ? "selected" : "unselected");
      } catch (e) {
        setStatus(
          hasLabel(node, STORAGE_ROLE_LABEL) ? "selected" : "unselected",
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
    [dispatch, node, status, t, model],
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
    [cpu, handleNodeSelectionChange, memory, name, role, status, uid, warnings],
  );
};

export type StorageClusterNodesSelectionTableRowViewModel = ReturnType<
  typeof useStorageClusterNodesSelectionTableRowViewModel
>;

type SuffixDecimalSI = "k" | "M" | "G" | "T" | "P" | "E";
type SuffixBinarySI = "Ki" | "Mi" | "Gi" | "Ti" | "Pi" | "Ei";
type QuantityDescriptorUnit = "m" | "B" | SuffixBinarySI | SuffixDecimalSI;
type NodeRoles =
  | "worker"
  | "master"
  | "control-plane"
  | typeof VALUE_NOT_AVAILABLE;
type ConvertableUnit = Extract<
  "B" | `${SuffixBinarySI | SuffixDecimalSI}B`,
  Unit
>;
type ConvertableMemoryValue = Converter<
  number,
  Extract<ConvertableUnit, MeasuresByUnit<"PiB" | "PB" | "B">>
>;
interface QuantityDescriptor {
  unit: QuantityDescriptorUnit;
  value: number;
}

const QUANTITY_RE =
  /^(?<sign>[+-])?(?<number>\d+|\d+\.\d+|\.\d+|\d+\.)(?<suffix>[mk]|Ki|[MGTPE]i?)?$/;

const parseQuantity = (
  quantity: string | number,
): QuantityDescriptor | Error => {
  const descriptor: QuantityDescriptor = { unit: "B", value: 0 };

  // When quantity is expressed as a plain integer, it is interpreted as bytes.
  if (typeof quantity === "number") {
    descriptor.value = quantity;
  } else {
    const result = quantity.match(QUANTITY_RE);
    if (!result) {
      return new Error(
        "quantities must match the regular expression " + QUANTITY_RE,
      );
    }

    const number = result.groups?.["number"];
    if (number) {
      descriptor.value = number.includes(".")
        ? parseFloat(number)
        : parseInt(number, 10);
    } else {
      return new Error("unable to parse numeric part of quantity");
    }

    const suffix = result.groups?.["suffix"];
    if (suffix) {
      descriptor.unit = suffix as QuantityDescriptorUnit;
    } else {
      return new Error("unable to parse quantity's suffix");
    }
  }

  return descriptor;
};

const getRole = (node: IoK8sApiCoreV1Node): NodeRoles => {
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

const toggleNodeStorageRoleLabel = (
  node: IoK8sApiCoreV1Node,
  shouldBeSelected: boolean,
): Record<string, string> => {
  const labels = getLabels(node);
  const result = window.structuredClone(labels);
  const [storageRoleLabelKey, storageRoleLabelValue] =
    STORAGE_ROLE_LABEL.split("=");
  if (shouldBeSelected) {
    result[storageRoleLabelKey] = storageRoleLabelValue;
  } else if (storageRoleLabelKey in result) {
    delete result[storageRoleLabelKey];
  }

  return result;
};

const getMemory = (
  node: IoK8sApiCoreV1Node,
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

const getCpu = (node: IoK8sApiCoreV1Node) => node.status?.capacity?.cpu;
