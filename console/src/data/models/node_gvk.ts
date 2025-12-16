export const groupVersionKind = {
  group: "core",
  version: "v1",
  kind: "Node",
} as const;

export const apiVersion = `${groupVersionKind.group}/${groupVersionKind.version}`;
