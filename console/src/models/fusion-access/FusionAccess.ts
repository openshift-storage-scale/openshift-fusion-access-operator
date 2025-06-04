import type { K8sResourceKind } from "@openshift-console/dynamic-plugin-sdk";

export interface FusionAccess extends K8sResourceKind {
  spec?: {
    ibm_cnsa_version?: "v5.2.3.0";
    storagedevicediscovery?: {
      create?: boolean;
    };
  };
  status?: {
    conditions?: Array<{
      lastTransitionTime: string;
      message: string;
      status: "True" | "False" | "Unknown";
      type: string;
    }>;
    externalImagePullError?: string;
    observedGeneration?: number;
    totalProvisionedDeviceCount?: number;
  };
}
