import { useCallback } from "react";
import {
  k8sCreate,
  useK8sModel,
} from "@openshift-console/dynamic-plugin-sdk";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";
import type { LunsViewModel } from "./useLunsViewModel";

// TODO(jkilzi): Hard-coded for now, but must handle namespaces dynamically
const NAMESPACE = "ibm-spectrum-scale";
const FUSION_NAMESPACE = "ibm-fusion-access";
const FILESYSTEM_JOB_IMAGE = "quay.io/aeros/openshift-fusion-access-filesystem-job:latest";

export const useCreateFileSystemHandler = (
  fileSystemName: string,
  luns: LunsViewModel
) => {
  const [, dispatch] = useStore<State, Actions>();

  const { t } = useFusionAccessTranslations();

  const redirectToFileSystemsHome = useRedirectHandler(
    "/fusion-access/file-systems"
  );

  const [jobModel] = useK8sModel({
    group: "batch",
    version: "v1",
    kind: "Job",
  });

  return useCallback(async () => {
    if (!luns.nodeName) {
      dispatch({
        type: "global/addAlert",
        payload: {
          title: "Node name is required to create a file system.",
          variant: "warning",
          dismiss: () => dispatch({ type: "global/dismissAlert" }),
        },
      });
      return;
    }

    try {
      dispatch({
        type: "global/updateCta",
        payload: { isLoading: true },
      });

      // Prepare LUN data - separate new and reused disks
      const selectedLuns = (luns.data || []).filter(lun => lun?.isSelected && lun?.path && lun?.wwn);
      
      if (selectedLuns.length === 0) {
        dispatch({
          type: "global/addAlert",
          payload: {
            title: "No LUNs selected",
            description: "Please select at least one LUN to create a filesystem.",
            variant: "warning",
            dismiss: () => dispatch({ type: "global/dismissAlert" }),
          },
        });
        return;
      }
      
      const newLuns = selectedLuns.filter(lun => !lun.isReused).map(lun => ({
        path: lun.path,
        wwn: lun.wwn,
        node: luns.nodeName!,
        isReused: false,
      }));
      
      const reusedLuns = selectedLuns.filter(lun => lun.isReused && lun.localDiskName).map(lun => ({
        path: lun.path,
        wwn: lun.wwn,
        node: luns.nodeName!,
        isReused: true,
        localDiskName: lun.localDiskName!,
      }));

      // Create the Job with configuration as environment variables - SINGLE API CALL
      // Add timestamp to ensure unique job names even if filesystem names are reused
      const timestamp = Date.now();
      const jobName = `filesystem-job-${fileSystemName}-${timestamp}`;
      
      const jobData = {
        apiVersion: "batch/v1",
        kind: "Job",
        metadata: { 
          name: jobName, 
          namespace: FUSION_NAMESPACE,
          labels: {
            "fusion.storage.openshift.io/filesystem-job": "true",
            "fusion.storage.openshift.io/filesystem-name": fileSystemName,
          },
        },
        spec: {
          template: {
            spec: {
              restartPolicy: "Never",
              serviceAccountName: "fusion-access-operator-controller-manager",
              containers: [
                {
                  name: "filesystem-creator",
                  image: FILESYSTEM_JOB_IMAGE,
                  imagePullPolicy: "Always",  // Always pull latest image
                  env: [
                    {
                      name: "OPERATION",
                      value: "create-filesystem",
                    },
                    {
                      name: "FILESYSTEM_NAME",
                      value: fileSystemName,
                    },
                    {
                      name: "NAMESPACE",
                      value: NAMESPACE,
                    },
                    {
                      name: "NEW_LUNS_JSON", 
                      value: JSON.stringify(newLuns),
                    },
                    {
                      name: "REUSED_LUNS_JSON",
                      value: JSON.stringify(reusedLuns),
                    },
                    {
                      name: "JOB_NAME",
                      value: jobName,
                    },
                    {
                      name: "FUSION_NAMESPACE",
                      value: FUSION_NAMESPACE,
                    },
                  ],
                },
              ],
            },
          },
          backoffLimit: 0,  // Never retry - preserve original failure reason
          activeDeadlineSeconds: 600, // 10 minutes timeout
          // No ttlSecondsAfterFinished - preserve failed jobs for debugging
        },
      };
      
      await k8sCreate({
        model: jobModel,
        data: jobData,
      });

      // Redirect immediately - user can check status on the filesystems page
      redirectToFileSystemsHome();
      
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("Filesystem creation job started"),
          description: `Job ${jobName} has been created. You can monitor its progress on the file systems page.`,
          variant: "info",
          dismiss: () => dispatch({ type: "global/dismissAlert" }),
        },
      });

    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("An error occurred while creating the filesystem job"),
          description,
          variant: "danger",
        },
      });
    } finally {
      dispatch({
        type: "global/updateCta",
        payload: { isLoading: false },
      });
    }
  }, [fileSystemName, luns, dispatch, redirectToFileSystemsHome, jobModel, t]);
};
