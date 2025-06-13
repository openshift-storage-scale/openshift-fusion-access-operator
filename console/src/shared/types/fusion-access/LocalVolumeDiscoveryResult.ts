import type { K8sResourceKind } from "@openshift-console/dynamic-plugin-sdk";

export interface LocalVolumeDiscoveryResult extends K8sResourceKind {
  spec: {
    nodeName: string;
  };
  status?: {
    discoveredDevices?: DiscoveredDevice[];
    discoveredTimeStamp?: string;
  };
}

export interface DiscoveredDevice {
  WWN: string;
  deviceID: string;
  model: string;
  path: string;
  size: number;
  type: string;
  vendor: string;
}
