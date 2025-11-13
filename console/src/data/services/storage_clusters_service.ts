import type { K8sModel } from "@openshift-console/dynamic-plugin-sdk";
import { k8sCreate } from "@openshift-console/dynamic-plugin-sdk";
import { STORAGE_CLUSTER_NAME, STORAGE_ROLE_LABEL } from "@/constants";
import type { Cluster } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Cluster";
import { apiVersion, groupVersionKind } from "../models/storage_cluster_gvk";

const nodeSelector = Object.fromEntries([STORAGE_ROLE_LABEL.split("=")]);

export const storageClustersService = {
  create(model: K8sModel): Promise<Cluster> {
    return k8sCreate<Cluster>({
      model,
      data: {
        apiVersion,
        kind: groupVersionKind.kind,
        metadata: { name: STORAGE_CLUSTER_NAME },
        spec: {
          license: { accept: true, license: "data-management" },
          pmcollector: {
            nodeSelector,
          },
          daemon: {
            nodeSelector,
          },
        },
      },
    });
  },
};
