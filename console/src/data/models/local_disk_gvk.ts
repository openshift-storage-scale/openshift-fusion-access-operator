export const groupVersionKind = {
  group: "scale.spectrum.ibm.com",
  version: "v1beta1",
  kind: "LocalDisk",
} as const;

export const apiVersion = `${groupVersionKind.group}/${groupVersionKind.version}`;
