import { type WatchK8sResource } from "@openshift-console/dynamic-plugin-sdk";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";
import type { IoK8sApiCoreV1Node } from "@/shared/types/kubernetes/1.30/types";

interface Options extends WatchK8sResource {
  withLabels?: Array<`${string}=${string}`>;
}

export const useWatchNode = (
  options: Omit<Options, "groupVersionKind" | "isList">
) =>
  useNormalizedK8sWatchResource<IoK8sApiCoreV1Node>({
    ...options,
    isList: true,
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
