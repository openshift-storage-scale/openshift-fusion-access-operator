export const groupVersionKind = {
  group: "route.openshift.io",
  version: "v1",
  kind: "Route",
} as const;

export const apiVersion = `${groupVersionKind.group}/${groupVersionKind.version}`;
