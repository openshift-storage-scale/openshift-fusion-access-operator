import {
  useK8sWatchResource,
  type WatchK8sResource,
} from "@openshift-console/dynamic-plugin-sdk";
import type { IoK8sApiCoreV1Node } from "@/shared/types/kubernetes/1.30/types";
import type { UseK8sWatchResourceWithInferedList } from "@/shared/utils/console/UseK8sWatchResource";

interface Options extends WatchK8sResource {
  withLabels?: Array<`${string}=${string}`>;
}

export const useWatchNode: UseK8sWatchResourceWithInferedList<
  IoK8sApiCoreV1Node,
  Omit<Options, "groupVersionKind">
> = (options) =>
  useK8sWatchResource({
    ...options,
    groupVersionKind: {
      version: "v1",
      kind: "Node",
    },
    selector: {
      ...options.selector,
      ...(options.withLabels && makeMatchLabelsSelector(options.withLabels)),
    },
  });

/**
 * Generates a selector object that matches the given Kubernetes labels.
 * @param labels - An array of label strings, each in the expected format "key=value".
 *                 The 'key' represents the label name and the 'value' represents its value.
 *                 If only the key is provided (i.e., with an equal sign and no value), the value defaults to an empty string.
 * @returns An object containing matchLabels for the provided labels.
 *
 * @example
 * ```ts
 * const input = ["scale.spectrum.ibm.com/role=storage", "node-role.kubernetes.io/worker="];
 * console.log(makeMatchLabelsSelector(input));
 * // Output: { matchLabels: { "scale.spectrum.ibm.com/role": "storage", "node-role.kubernetes.io/worker": "" } }
 * ```
 */
const makeMatchLabelsSelector = (labels: Array<`${string}=${string}`>) => ({
  matchLabels: Object.fromEntries(
    labels.map((label) => {
      const [key, value = ""] = label.split("=");
      return [key, value];
    })
  ),
});
