import type { K8sResourceKind } from "@openshift-console/dynamic-plugin-sdk";

export interface LocalDisk extends K8sResourceKind {
  spec?: {
    device: string;
    existingDataSkipVerify?: boolean;
    failureGroup?: string;
    node: string;
    nodeConnectionSelector?: {
      matchExpressions?: Array<{
        key: string;
        operator: string;
        values?: string[];
      }>;
      matchLabels?: Record<string, string>;
    };
    thinDiskType?: "no" | "nvme" | "scsi" | "auto";
  };
  status?: {
    conditions?: Array<{
      lastTransitionTime: string;
      message: string;
      observedGeneration?: number;
      reason: string;
      status: "True" | "False" | "Unknown";
      type: string;
    }>;
    failuregroup: string;
    failuregroupMapping: string;
    filesystem: string;
    nodeConnections: string;
    pool: string;
    size: string;
    type: string;
  };
}
