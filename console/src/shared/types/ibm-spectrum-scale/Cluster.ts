// This file was auto-generated from the filesystem CRD schema.
// Do not edit manually. Update the schema and regenerate if needed.
import type { K8sResourceKind } from "@openshift-console/dynamic-plugin-sdk";
export interface Cluster extends K8sResourceKind {
  spec?: ClusterSpec;
  status?: ClusterStatus;
}

export interface ClusterSpec {
  networkPolicy?: Record<string, unknown>;
  license: LicenseSpec;
  daemon?: DaemonSpec;
  clusterProfile?: ClusterProfile;
  clusterNameOverride?: string;
  hostAliases?: HostAlias[];
  nodeSelectorExpressions?: NodeSelectorRequirement[];
  tolerations?: Toleration[];
  roles?: RoleSpec[];
  site?: SiteSpec;
  grafanaBridge?: GrafanaBridgeSpec;
  regionalDR?: RegionalDRSpec;
  pmcollector?: PMCollectorSpec;
  csi?: CSISpec;
  gui?: GUISpec;
}

export interface LicenseSpec {
  accept: true;
  license: "data-access" | "data-management" | "erasure-code";
}

export interface DaemonSpec {
  nsdDevicesConfig?: NSDDevicesConfig;
  nodeSelector?: Record<string, string>;
  update?: DaemonUpdateSpec;
  clusterProfile?: ClusterProfile;
  clusterNameOverride?: string;
  hostAliases?: HostAlias[];
  nodeSelectorExpressions?: NodeSelectorRequirement[];
  tolerations?: Toleration[];
  roles?: RoleSpec[];
}

export interface NSDDevicesConfig {
  bypassDiscovery?: boolean;
  localDevicePaths?: LocalDevicePath[];
}

export interface LocalDevicePath {
  devicePath?: string;
  deviceType?: string;
}

export interface DaemonUpdateSpec {
  maxUnavailable?: number | string;
  paused?: boolean;
  pools?: UpdatePool[];
}

export interface UpdatePool {
  maxUnavailable?: number | string;
  name: string;
  nodeSelector?: NodeSelector;
  paused?: boolean;
}

export interface NodeSelector {
  matchExpressions?: NodeSelectorRequirement[];
  matchLabels?: Record<string, string>;
}

export interface NodeSelectorRequirement {
  key: string;
  operator: string;
  values?: string[];
}

export interface Toleration {
  effect?: string;
  key?: string;
  operator?: string;
  tolerationSeconds?: number;
  value?: string;
}

export interface ClusterProfile {
  maxTcpConnsPerNodeConn?: string;
  nsdRAIDBlockDeviceScheduler?: string;
  afmHashVersion?: string;
  afmDIO?: string;
  verbsRdmaSend?: "yes" | "no";
  nsdRAIDBlockDeviceNrRequests?: string;
  nsdRAIDSmallThreadRatio?: string;
  proactiveReconnect?: "yes" | "no";
  nspdThreadsPerQueue?: string;
  controlSetxattrImmutableSELinux?: string;
  verbsRdmaCm?: "enable" | "disable";
  nsdRAIDMaxPdiskQueueDepth?: string;
  nsdRAIDDiskCheckVWCE?: string;
  qMaxBlockShare?: string;
  nsdMaxWorkerThreads?: string;
  tscCmdPortRange?: string;
  nsdRAIDMasterBufferPoolSize?: string;
  nsdRAIDEventLogToConsole?: string;
  ignoreReplicationForQuota?: "yes" | "no";
  maxblocksize?: string;
  prefetchTimeout?: string;
  prefetchPct?: string;
  nsdRAIDBlockDeviceQueueDepth?: string;
  initPrefetchBuffers?: string;
  seqDiscardThreshold?: string;
  nsdRAIDFlusherFWLogHighWatermarkMB?: string;
  panicOnIOHang?: string;
  pitWorkerThreadsPerNode?: string;
  afmAsyncDelay?: string;
  nspdBufferMemPerQueue?: string;
  qRevokeDisable?: string;
  nsdRAIDTracks?: string;
  prefetchThreads?: string;
  ignorePrefetchLUNCount?: string;
  nsdRAIDNonStealableBufPct?: string;
  ignoreReplicaSpaceOnStat?: "yes" | "no";
  readReplicaPolicy?: "default" | "local" | "fastest";
  nsdRAIDThreadsPerQueue?: string;
  encryptionKeyCacheExpiration?: string;
  nsdRAIDDefaultGeneratedFD?: string;
  enforceFilesetQuotaOnRoot?: string;
  afmMaxParallelRecoveries?: string;
  nsdRAIDMaxRecoveryRetries?: string;
  nsdRAIDReconstructAggressiveness?: string;
  nsdRAIDMaxTransientStale2FT?: string;
  nsdRAIDMaxTransientStale3FT?: string;
  numaMemoryInterleave?: string;
  pagepoolMaxPhysMemPct?: string;
  nsdMultiQueue?: string;
  traceGenSubDir?: "/var/mmfs/tmp/traces";
  cloudEnv?: "general";
  nsdMinWorkerThreads?: string;
  nsdSmallThreadRatio?: string;
  verbsRdma?: "enable" | "disable";
  backgroundSpaceReclaimThreshold?: string;
  ignoreReplicationOnStatfs?: "yes" | "no";
  nsdRAIDBlockDeviceMaxSectorsKB?: string;
  nsdRAIDBufferPoolSizePct?: string;
  nspdQueues?: string;
  tscCmdAllowRemoteConnections?: "yes" | "no";
  maxMBpS?: string;
  verbsPorts?: string;
  nsdRAIDReadRGDescriptorTimeout?: string;
  maxBufferDescs?: string;
  afmObjKeyExpiration?: string;
}

export interface HostAlias {
  hostname: string;
  ip: string;
}

export interface RoleSpec {
  limits?: ResourceLimits;
  name?: "afm" | "storage" | "client";
  profile?: ClusterProfile;
  resources?: ResourceLimits;
}

export interface ResourceLimits {
  cpu?: string;
  memory?: string;
}

export interface SiteSpec {
  name: string;
  zone: string;
}

export interface GrafanaBridgeSpec {
  enablePrometheusExporter?: boolean;
  nodeSelector?: Record<string, string>;
  tolerations?: Toleration[];
}

export interface RegionalDRSpec {
  nodeSelector?: Record<string, string>;
  tolerations?: Toleration[];
}

export interface PMCollectorSpec {
  nodeSelector?: Record<string, string>;
  storageClass?: string;
  tolerations?: Toleration[];
}

export interface CSISpec {
  sidecar?: CSISidecarSpec;
}

export interface CSISidecarSpec {
  nodeSelector?: Record<string, string>;
}

export interface GUISpec {
  containerResources?: GUIContainerResource[];
  enableSessionIPCheck?: boolean;
  nodeSelector?: Record<string, string>;
  tolerations?: Toleration[];
}

export interface GUIContainerResource {
  name: "liberty" | "postgres";
  resources: GUIResourceSpec;
}

export interface GUIResourceSpec {
  claims?: GUIResourceClaim[];
  limits?: Record<string, number | string>;
  requests?: Record<string, number | string>;
}

export interface GUIResourceClaim {
  name: string;
}

export interface ClusterStatus {
  conditions?: ClusterCondition[];
}

export interface ClusterCondition {
  lastTransitionTime: string;
  message: string;
  observedGeneration?: number;
  reason: string;
  status: "True" | "False" | "Unknown";
  type: string;
}
