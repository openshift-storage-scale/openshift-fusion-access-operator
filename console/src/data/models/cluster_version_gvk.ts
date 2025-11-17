export const groupVersionKind = {
  group: "config.openshift.io",
  version: "v1",
  kind: "ClusterVersion",
} as const;

export const apiVersion = `${groupVersionKind.group}/${groupVersionKind.version}`;
