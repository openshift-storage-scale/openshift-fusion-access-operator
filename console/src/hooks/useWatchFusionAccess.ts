import type { FusionAccess } from "@/models/fusion-access/FusionAccess";
import type { UseK8sWatchResourceWithInferedList } from "@/utils/console/UseK8sWatchResource";
import {
  useK8sWatchResource,
  type WatchK8sResource,
} from "@openshift-console/dynamic-plugin-sdk";

export const useWatchFusionAccess: UseK8sWatchResourceWithInferedList<
  FusionAccess,
  Omit<WatchK8sResource, "groupVersionKind" | "namespaced" | "namespace">
> = (options) => {
  return useK8sWatchResource({
    ...options,
    namespaced: true,
    namespace: "ibm-fusion-access",
    groupVersionKind: {
      group: "fusion.storage.openshift.io",
      version: "v1alpha1",
      kind: "FusionAccess",
    },
  });
};
