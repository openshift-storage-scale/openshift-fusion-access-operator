import {
  type K8sModel,
  k8sPatch,
  type Patch,
} from "@openshift-console/dynamic-plugin-sdk";
import type { IoK8sApiCoreV1Node } from "@/shared/types/openshift/4.19/types";

export const nodesServices = {
  patch(
    model: K8sModel,
    node: IoK8sApiCoreV1Node,
    patch: Patch[],
  ): Promise<IoK8sApiCoreV1Node> {
    return k8sPatch({
      data: patch,
      model,
      resource: node,
    });
  },
};
