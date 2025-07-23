import {
  k8sGet,
  useK8sModel,
  type K8sModel,
} from "@openshift-console/dynamic-plugin-sdk";
import type { LocalDisk } from "@/shared/types/ibm-spectrum-scale/LocalDisk";

interface WaitForLocalDiskConditionOptions {
  name: string;
  namespace: string;
  model: K8sModel;
  timeoutMs?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export interface LocalDiskConditionError extends Error {
  reason: "TIMEOUT" | "CONDITION_NOT_MET" | "RESOURCE_NOT_FOUND" | "UNKNOWN";
}

/**
 * Waits for a LocalDisk resource to have the "Used" condition set to "False".
 * Uses exponential backoff with a configurable timeout.
 * 
 * @param options Configuration options for waiting
 * @returns Promise that resolves when condition is met, rejects on timeout or error
 */
export const waitForLocalDiskUsedConditionFalse = async ({
  name,
  namespace,
  model,
  timeoutMs = 5 * 60 * 1000, // 5 minutes
  initialDelayMs = 1000, // 1 second
  maxDelayMs = 10000, // 10 seconds
}: WaitForLocalDiskConditionOptions): Promise<void> => {
  const startTime = Date.now();
  let currentDelay = initialDelayMs;
  let attemptCount = 0;

  const createError = (reason: LocalDiskConditionError["reason"], message: string): LocalDiskConditionError => {
    const error = new Error(message) as LocalDiskConditionError;
    error.reason = reason;
    return error;
  };

  const checkCondition = async (): Promise<boolean> => {
    try {
      const localDisk = await k8sGet<LocalDisk>({
        model,
        name,
        ns: namespace,
      });

      // Check if the "Used" condition exists and is "False"
      const conditions = localDisk.status?.conditions || [];
      const usedCondition = conditions.find((condition: { type: string; status: string }) => condition.type === "Used");

      if (!usedCondition) {
        // If no "Used" condition exists, we consider it as not used (False)
        return true;
      }

      return usedCondition.status === "False";
    } catch (error) {
      // If the resource is not found, it might have been deleted
      if (error && typeof error === "object" && "status" in error && error.status === 404) {
        throw createError("RESOURCE_NOT_FOUND", `LocalDisk "${name}" not found in namespace "${namespace}"`);
      }
      
      // Re-throw other errors
      throw createError("UNKNOWN", error instanceof Error ? error.message : String(error));
    }
  };

  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  // Exponential backoff polling loop
  while (Date.now() - startTime < timeoutMs) {
    attemptCount++;

    try {
      const conditionMet = await checkCondition();
      
      if (conditionMet) {
        return; // Success - condition is met
      }
    } catch (error) {
      // For resource not found errors, rethrow immediately
      if (error instanceof Error && (error as LocalDiskConditionError).reason === "RESOURCE_NOT_FOUND") {
        throw error;
      }
      
      // For other errors, log and continue trying (might be temporary network issues)
      console.warn(`Attempt ${attemptCount} failed while checking LocalDisk condition:`, error);
    }

    // Check if we have time for another attempt
    const elapsed = Date.now() - startTime;
    if (elapsed + currentDelay >= timeoutMs) {
      break; // Would exceed timeout
    }

    // Wait before next attempt
    await sleep(currentDelay);

    // Exponential backoff: double the delay, but cap it at maxDelayMs
    currentDelay = Math.min(currentDelay * 2, maxDelayMs);
  }

  // Timeout reached
  throw createError(
    "TIMEOUT", 
    `Timeout after ${timeoutMs}ms waiting for LocalDisk "${name}" "Used" condition to become "False"`
  );
};

/**
 * Hook version of waitForLocalDiskUsedConditionFalse that provides the LocalDisk model.
 * 
 * @returns A function that can be called to wait for the condition
 */
export const useWaitForLocalDiskUsedConditionFalse = () => {
  const [localDiskModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "LocalDisk",
  });

  return (options: Omit<WaitForLocalDiskConditionOptions, "model">) => {
    return waitForLocalDiskUsedConditionFalse({
      ...options,
      model: localDiskModel,
    });
  };
}; 