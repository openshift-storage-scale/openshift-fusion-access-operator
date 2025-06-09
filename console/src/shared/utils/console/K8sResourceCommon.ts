import type { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";

export const getName = (obj: K8sResourceCommon) => obj.metadata?.name;
export const getUid = (obj: K8sResourceCommon) => obj.metadata?.uid;
export const getLabels = (obj: K8sResourceCommon) => obj.metadata?.labels ?? {};
export const hasLabel = (obj: K8sResourceCommon, label: string): boolean => {
  let result: boolean = false;
  const [k, v] = label.split("=");
  const labels = getLabels(obj);

  if (labels) {
    result = labels[k] === v;
  }

  return result;
};
