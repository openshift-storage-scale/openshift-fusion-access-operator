import type { K8sResourceKind } from "@openshift-console/dynamic-plugin-sdk";

export interface FusionAccess extends K8sResourceKind {
  spec?: {
    storageScaleVersion?: "v5.2.3.0";
    storageDeviceDiscovery?: {
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
    externalImagePullStatus?: number;
    observedGeneration?: number;
    totalProvisionedDeviceCount?: number;
  };
}
