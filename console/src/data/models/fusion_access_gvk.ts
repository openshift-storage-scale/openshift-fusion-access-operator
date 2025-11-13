export const groupVersionKind = {
  group: "fusion.storage.openshift.io",
  version: "v1alpha1",
  kind: "FusionAccess",
} as const;

export const apiVersion = `${groupVersionKind.group}/${groupVersionKind.version}`;
