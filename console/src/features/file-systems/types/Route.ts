import type { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";

export interface Route extends K8sResourceCommon {
  spec: {
    host: string;
  };
}
