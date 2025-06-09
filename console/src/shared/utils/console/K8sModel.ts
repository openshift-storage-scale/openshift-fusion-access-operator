import type {
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceKindReference,
} from "@openshift-console/dynamic-plugin-sdk";

export const toRef = (m: K8sModel): K8sResourceKindReference => {
  const { apiGroup, apiVersion, kind } = m;
  return apiGroup
    ? `${apiGroup}~${apiVersion}~${kind}`
    : `${apiVersion}~${kind}`;
};

export const toGroupVersionKind = (m: K8sModel): K8sGroupVersionKind => {
  const { apiGroup, apiVersion, kind } = m;
  return {
    group: apiGroup,
    version: apiVersion,
    kind: kind,
  };
};
