import { useCallback } from "react";
import {
  useK8sModel,
  k8sCreate,
} from "@openshift-console/dynamic-plugin-sdk";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import type { FilesystemJobStatus } from "@/shared/hooks/useWatchFilesystemJobs";

export interface CleanupTarget {
  type: 'failed-job' | 'failed-filesystem' | 'filesystem';
  name: string;
  namespace: string;
  job?: FilesystemJobStatus;
  filesystem?: FileSystem;
}

interface CleanupModalState {
  target?: CleanupTarget;
  isOpen: boolean;
  isProcessing: boolean;
  errors: string[];
}

interface CleanupModalActions {
  setTarget: (target: CleanupTarget | undefined) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
  setErrors: (errors: string[]) => void;
  handleCleanup: (target: CleanupTarget) => () => void;
  handleClose: () => void;
}

// TODO(jkilzi): Hard-coded for now, but must handle namespaces dynamically
const FUSION_NAMESPACE = "ibm-fusion-access";
const FILESYSTEM_JOB_IMAGE = "quay.io/aeros/openshift-fusion-access-filesystem-job:latest";

export type CleanupHandler = () => Promise<void>;

export const useCleanupHandler = (
  target: CleanupTarget | undefined,
  onComplete?: () => void
): CleanupHandler => {
  const { t } = useFusionAccessTranslations();

  const [jobModel] = useK8sModel({
    group: "batch",
    version: "v1",
    kind: "Job",
  });

  return useCallback(async () => {
    if (!target) {
      return;
    }

    try {
      // Create a cleanup job based on the target type
      const timestamp = Date.now();
      const jobName = `cleanup-job-${target.name}-${timestamp}`;

      let operation: string;
      let envVars: Array<{ name: string; value: string }> = [
        { name: "TARGET_NAME", value: target.name },
        { name: "TARGET_NAMESPACE", value: target.namespace },
      ];

      switch (target.type) {
        case 'failed-job':
          operation = "cleanup-failed-job";
          if (target.job) {
            envVars.push(
              { name: "FAILED_JOB_NAME", value: target.job.name },
              { name: "FAILED_JOB_NAMESPACE", value: target.job.namespace }
            );
            if (target.job.createdResources) {
              envVars.push({
                name: "CREATED_RESOURCES",
                value: JSON.stringify(target.job.createdResources)
              });
            }
          }
          break;
        case 'failed-filesystem':
          operation = "cleanup-filesystem";
          if (target.job) {
            envVars.push(
              { name: "FAILED_JOB_NAME", value: target.job.name },
              { name: "FAILED_JOB_NAMESPACE", value: target.job.namespace }
            );
          }
          break;
        case 'filesystem':
          operation = "delete-filesystem";
          break;
        default:
          throw new Error(`Unknown cleanup target type: ${target.type}`);
      }

      envVars.push({ name: "OPERATION", value: operation });

      const jobData = {
        apiVersion: "batch/v1",
        kind: "Job",
        metadata: {
          name: jobName,
          namespace: FUSION_NAMESPACE,
          labels: {
            "fusion.storage.openshift.io/cleanup-job": "true",
            "fusion.storage.openshift.io/target-name": target.name,
            "fusion.storage.openshift.io/operation": operation,
          },
        },
        spec: {
          template: {
            spec: {
              restartPolicy: "Never",
              serviceAccountName: "fusion-access-operator-controller-manager",
              containers: [
                {
                  name: "filesystem-job",
                  image: FILESYSTEM_JOB_IMAGE,
                  imagePullPolicy: "Always",
                  env: envVars,
                },
              ],
            },
          },
          backoffLimit: 0, // Never retry
          activeDeadlineSeconds: 300, // 5 minutes timeout
          // No ttlSecondsAfterFinished - preserve for debugging
        },
      };

      await k8sCreate({
        model: jobModel,
        data: jobData,
      });

      console.log(`Cleanup job ${jobName} created for ${target.type}: ${target.name}`);
      
      // Call onComplete immediately - the job will handle the actual cleanup
      onComplete?.();

    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      throw new Error(description);
    }
  }, [
    target,
    jobModel,
    onComplete,
  ]);
}; 