// This file was auto-generated from the filesystem CRD schema.
// Do not edit manually. Update the schema and regenerate if needed.
import type { K8sResourceKind } from "@openshift-console/dynamic-plugin-sdk";

// ---
// Top-level FileSystem resource
export interface FileSystem extends K8sResourceKind {
  spec?: FileSystemSpec;
  status?: FileSystemStatus;
}

// ---
// Spec Section
export interface FileSystemSpec {
  local?: FileSystemLocalSpec;
  remote?: FileSystemRemoteSpec;
  seLinuxOptions?: SELinuxOptions;
  vdiskNSD?: FileSystemVdiskNSDSpec;
}

export interface FileSystemLocalSpec {
  blockSize?:
    | "64k"
    | "128k"
    | "256k"
    | "512k"
    | "1m"
    | "2m"
    | "4m"
    | "8m"
    | "16m"
    | "64k"
    | "128k"
    | "256K"
    | "512K"
    | "1M"
    | "2M"
    | "4M"
    | "8M"
    | "16M";
  pools: FileSystemPoolSpec[];
  replication: "1-way" | "2-way" | "3-way";
  type: "shared" | "unshared";
}

export interface FileSystemPoolSpec {
  disks: string[];
  name?: string;
}

export interface FileSystemRemoteSpec {
  cluster: string;
  fs: string;
}

export interface SELinuxOptions {
  level?: string;
  role?: string;
  type?: string;
  user?: string;
}

export interface FileSystemVdiskNSDSpec {
  replication?: "1-way" | "2-way";
  tiebreaker?: FileSystemTiebreakerSpec;
  vdiskSets?: FileSystemVdiskSetSpec[];
}

export interface FileSystemTiebreakerSpec {
  device: string;
  nodeDaemonName: string;
}

export interface FileSystemVdiskSetSpec {
  blockSize?:
    | "256k"
    | "512k"
    | "1m"
    | "2m"
    | "4m"
    | "8m"
    | "16m"
    | "256K"
    | "512K"
    | "1M"
    | "2M"
    | "4M"
    | "8M"
    | "16M";
  declusteredArray?: string;
  failureGroup?: number;
  nsdUsage?: "dataAndMetadata" | "metadataOnly" | "dataOnly";
  raidCode?:
    | "3WayReplication"
    | "4WayReplication"
    | "4+2P"
    | "4+3P"
    | "8+2P"
    | "8+3P";
  recoveryGroups?: string[];
  setSize?: string;
  storagePool?: string;
}

// ---
// Status Section
export interface FileSystemStatus {
  conditions?: FileSystemCondition[];
  maintenanceMode?: "enabled" | "disabled" | "unknown" | "not supported";
  pools?: FileSystemPoolStatus[];
  seLinuxOptions?: SELinuxOptions;
  uid?: string;
  version?: string;
}

export interface FileSystemCondition {
  lastTransitionTime: string;
  message: string;
  observedGeneration?: number;
  reason: string;
  status: "True" | "False" | "Unknown";
  type: string;
}

export interface FileSystemPoolStatus {
  diskCount?: number;
  disks?: string;
  failureGroups?: FileSystemFailureGroupStatus[];
  name?: string;
  totalDiskSize?: string;
}

export interface FileSystemFailureGroupStatus {
  diskCount?: number;
  disks?: string;
  failureGroup?: string;
  totalDiskSize?: string;
}
