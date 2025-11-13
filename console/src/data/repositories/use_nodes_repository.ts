import {
  useK8sModel,
  type WatchK8sResource,
} from "@openshift-console/dynamic-plugin-sdk";
import { useCallback } from "react";
import { STORAGE_ROLE_LABEL } from "@/constants";
import type { IoK8sApiCoreV1Node } from "@/shared/types/openshift/4.19/types";
import { getLabels } from "@/shared/utils/k8s_resource_common";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/node_gvk";
import { nodesServices } from "../services/nodes_services";

interface Options extends WatchK8sResource {
  withLabels?: Array<`${string}=${string}`>;
}

export const useNodesRepository = (
  options: Omit<Options, "groupVersionKind" | "isList"> = {},
) => {
  const result = useWatchNodes(options);
  const [model] = useK8sModel(groupVersionKind);

  const patchNodeStorageRoleLabel = useCallback(
    (node: IoK8sApiCoreV1Node, checked: boolean) => {
      return nodesServices.patch(model, node, [
        {
          op: "replace",
          path: "/metadata/labels",
          value: toggleNodeStorageRoleLabel(node, checked),
        },
      ]);
    },
    [model],
  );

  return {
    loaded: result.loaded,
    error: result.error,
    nodes: result.data ?? [],
    patchNodeStorageRoleLabel,
  };
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

const useWatchNodes = (
  options: Omit<Options, "groupVersionKind" | "isList"> = {},
) =>
  useNormalizedK8sWatchResource<IoK8sApiCoreV1Node>({
    ...options,
    isList: true,
    groupVersionKind,
    selector: {
      ...options.selector,
      ...(options.withLabels && makeMatchLabelsSelector(options.withLabels)),
    },
  });

const makeMatchLabelsSelector = (labels: Array<`${string}=${string}`>) => ({
  matchLabels: Object.fromEntries(labels.map((label) => label.split("="))),
});
