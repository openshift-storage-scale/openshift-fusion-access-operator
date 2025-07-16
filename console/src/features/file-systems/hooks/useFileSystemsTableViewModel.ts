import { useMemo } from "react";
import { type TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchFileSystem } from "@/shared/hooks/useWatchFileSystem";
import { useWatchFilesystemJobs, type FilesystemJobStatus } from "@/shared/hooks/useWatchFilesystemJobs";
import { useCleanupModal } from "./useCleanupModal";
import { useRoutes } from "./useRoutes";

// Unified type that can represent either a filesystem or a job
export interface UnifiedFilesystemEntry {
  type: 'filesystem' | 'job';
  id: string; // unique identifier
  name: string; // filesystem name
  filesystem?: FileSystem; // present if type is 'filesystem'
  job?: FilesystemJobStatus; // present if type is 'job'
  relatedJob?: FilesystemJobStatus; // present when filesystem exists but has associated job info
}

export const useFileSystemsTableViewModel = () => {
  const { t } = useFusionAccessTranslations();

  const columns: TableColumn<UnifiedFilesystemEntry>[] = useMemo(
    () => [
      {
        id: "name",
        title: t("Name"),
        props: { className: "pf-v6-u-w-25" },
      },
      {
        id: "status",
        title: t("Status"),
        props: { className: "pf-v6-u-w-10" },
      },
      {
        id: "raw-capacity",
        title: t("Raw capacity"),
        props: { className: "pf-v6-u-w-10" },
      },
      {
        id: "storage-class",
        title: t("StorageClass"),
        props: { className: "pf-v6-u-w-10" },
      },
      {
        id: "dashboard-link",
        title: t("Link to file system dashboard"),
        props: { className: "pf-v6-u-w-10" },
      },
      {
        id: "actions",
        title: "",
        props: { className: "pf-v6-c-table__action" },
      },
    ],
    [t]
  );

  const cleanupModal = useCleanupModal();
  const fileSystems = useWatchFileSystem();
  const { jobs: filesystemJobs, loaded: jobsLoaded, error: jobsError } = useWatchFilesystemJobs();

  // Combine filesystem objects and jobs into unified entries
  const unifiedData = useMemo(() => {
    const entries: UnifiedFilesystemEntry[] = [];
    const existingFilesystemNames = new Set<string>();
    const jobsByFilesystemName = new Map<string, FilesystemJobStatus>();

    // Create a map of jobs by filesystem name for easy lookup
    filesystemJobs.forEach(job => {
      jobsByFilesystemName.set(job.filesystemName, job);
    });

    // Add actual filesystem objects first (these take priority)
    (fileSystems.data || []).forEach(fs => {
      if (fs.metadata?.name) {
        existingFilesystemNames.add(fs.metadata.name);
        
        // Check if there's a related job for this filesystem
        const relatedJob = jobsByFilesystemName.get(fs.metadata.name);
        
        entries.push({
          type: 'filesystem',
          id: `fs-${fs.metadata.name}`,
          name: fs.metadata.name,
          filesystem: fs,
          relatedJob: relatedJob, // Include job info for progress/status
        });
      }
    });

    // Only add jobs for filesystems that DON'T have existing filesystem objects
    // This prevents duplicate entries
    filesystemJobs.forEach(job => {
      // Only show job if:
      // 1. No filesystem object exists for this name, AND
      // 2. Job is either active (not completed) OR failed (so users can see what went wrong)
      if (!existingFilesystemNames.has(job.filesystemName) && (!job.completed || job.failed)) {
        entries.push({
          type: 'job',
          id: `job-${job.name}`,
          name: job.filesystemName,
          job: job,
        });
      }
    });

    return entries;
  }, [fileSystems.data, filesystemJobs]);

  const routes = useRoutes();

  return useMemo(
    () =>
      ({
        columns,
        cleanupModal,
        fileSystems: {
          data: unifiedData,
          loaded: fileSystems.loaded && jobsLoaded,
          error: fileSystems.error || jobsError,
        },
        routes,
      }) as const,
    [columns, cleanupModal, unifiedData, fileSystems.loaded, jobsLoaded, fileSystems.error, jobsError, routes]
  );
};

export type FileSystemsTableViewModel = ReturnType<
  typeof useFileSystemsTableViewModel
>;
