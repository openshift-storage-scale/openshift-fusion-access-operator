import { useK8sWatchResource } from "@openshift-console/dynamic-plugin-sdk";

export interface FilesystemJobPhase {
  currentPhase: string;
  message: string;
  progress?: string;
  error?: string;
}

export interface FilesystemJobCreatedResources {
  localDisks: string[];
  fileSystem?: string;
  storageClass?: string;
}

export interface FilesystemJobStatus {
  name: string;
  namespace: string;
  filesystemName: string;
  phase: string;
  phaseDetails: FilesystemJobPhase | null;
  createdResources: FilesystemJobCreatedResources | null;
  completed: boolean;
  succeeded: boolean;
  failed: boolean;
  startTime?: string;
  completionTime?: string;
}

const parseJobAnnotations = (job: any): Omit<FilesystemJobStatus, 'name' | 'namespace' | 'filesystemName'> => {
  const annotations = job.metadata?.annotations || {};
  
  // Extract phase details
  let phaseDetails: FilesystemJobPhase | null = null;
  const phaseDetailsStr = annotations["fusion.storage.openshift.io/phase-details"];
  if (phaseDetailsStr) {
    try {
      phaseDetails = JSON.parse(phaseDetailsStr);
    } catch (e) {
      console.warn("Failed to parse phase details:", e);
    }
  }

  // Extract created resources
  let createdResources: FilesystemJobCreatedResources | null = null;
  const createdResourcesStr = annotations["fusion.storage.openshift.io/created-resources"];
  if (createdResourcesStr) {
    try {
      createdResources = JSON.parse(createdResourcesStr);
    } catch (e) {
      console.warn("Failed to parse created resources:", e);
    }
  }

  // Get job status from Kubernetes
  const conditions = job.status?.conditions || [];
  const completedCondition = conditions.find((c: any) => c.type === "Complete");
  const failedCondition = conditions.find((c: any) => c.type === "Failed");
  
  const completed = completedCondition?.status === "True" || failedCondition?.status === "True";
  const succeeded = completedCondition?.status === "True";
  const failed = failedCondition?.status === "True";

  const phase = annotations["fusion.storage.openshift.io/current-phase"] || "unknown";

  return {
    phase,
    phaseDetails,
    createdResources,
    completed,
    succeeded,
    failed,
    startTime: job.status?.startTime,
    completionTime: job.status?.completionTime,
  };
};

export const useWatchFilesystemJobs = () => {
  const [jobs, loaded, loadError] = useK8sWatchResource({
    isList: true,
    groupVersionKind: {
      group: "batch",
      version: "v1",
      kind: "Job",
    },
    namespace: "ibm-fusion-access", // TODO: Make this configurable
    selector: {
      matchLabels: {
        "fusion.storage.openshift.io/filesystem-job": "true",
      },
    },
  });

  const jobStatuses: FilesystemJobStatus[] = (jobs as any[] || []).map((job: any) => {
    const filesystemName = job.metadata?.labels?.["fusion.storage.openshift.io/filesystem-name"] || "unknown";
    const { phase, phaseDetails, createdResources, completed, succeeded, failed, startTime, completionTime } = parseJobAnnotations(job);

    return {
      name: job.metadata?.name || "",
      namespace: job.metadata?.namespace || "",
      filesystemName,
      phase,
      phaseDetails,
      createdResources,
      completed,
      succeeded,
      failed,
      startTime,
      completionTime,
    };
  });

  return {
    jobs: jobStatuses,
    loaded,
    error: loadError,
  };
};

export const useWatchFilesystemJob = (jobName: string) => {
  const [job, loaded, loadError] = useK8sWatchResource({
    groupVersionKind: {
      group: "batch",
      version: "v1", 
      kind: "Job",
    },
    name: jobName,
    namespace: "ibm-fusion-access", // TODO: Make this configurable
  });

  if (!loaded || loadError || !job) {
    return {
      job: null,
      loaded,
      error: loadError,
    };
  }

  const filesystemName = (job as any).metadata?.labels?.["fusion.storage.openshift.io/filesystem-name"] || "unknown";
  const { phase, phaseDetails, createdResources, completed, succeeded, failed, startTime, completionTime } = parseJobAnnotations(job);

  const jobStatus: FilesystemJobStatus = {
    name: (job as any).metadata?.name || "",
    namespace: (job as any).metadata?.namespace || "",
    filesystemName,
    phase,
    phaseDetails,
    createdResources,
    completed,
    succeeded,
    failed,
    startTime,
    completionTime,
  };

  return {
    job: jobStatus,
    loaded,
    error: loadError,
  };
}; 