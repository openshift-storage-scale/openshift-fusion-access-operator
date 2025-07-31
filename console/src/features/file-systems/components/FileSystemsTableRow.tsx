import { useMemo } from "react";
import {
  type RowProps,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import { 
  Skeleton, 
  Progress, 
  Label,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InProgressIcon,
} from "@patternfly/react-icons";
import { KebabMenu, type KebabMenuProps } from "@/shared/components/KebabMenu";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import type { FileSystemsTableViewModel, UnifiedFilesystemEntry } from "../hooks/useFileSystemsTableViewModel";
import type { CleanupTarget } from "../hooks/useCleanupHandler";
import { useFileSystemTableRowViewModel } from "../hooks/useFileSystemTableRowViewModel";
import { FileSystemsDashboardLink } from "./FileSystemsDashboardLink";
import { FileSystemStorageClasses } from "./FileSystemsStorageClasses";
import { FileSystemStatusDetails } from "./FileSystemStatusDetails";

export type RowData = Pick<FileSystemsTableViewModel, "columns" | "routes"> &
  Pick<FileSystemsTableViewModel["cleanupModal"], "handleCleanup">;

type FileSystemsTabTableRowProps = RowProps<UnifiedFilesystemEntry, RowData>;

// Helper function to get job progress
const getJobProgress = (phase: string, completed: boolean, failed: boolean): number => {
  if (completed) return 100;
  if (failed) {
    switch (phase) {
      case "starting": return 0;
      case "creating-localdisks": return 10;
      case "creating-filesystem": return 40;
      case "creating-storageclass": return 80;
      default: return 0;
    }
  }
  
  switch (phase) {
    case "starting": return 5;
    case "creating-localdisks": return 25;
    case "creating-filesystem": return 60;
    case "creating-storageclass": return 90;
    case "completed": return 100;
    default: return 0;
  }
};

const getJobStatusDescription = (phase: string, failed: boolean, completed: boolean): string => {
  if (failed) return "Creation failed";
  if (completed) return "Created successfully";
  
  switch (phase) {
    case "starting": return "Starting creation...";
    case "creating-localdisks": return "Creating storage disks...";
    case "creating-filesystem": return "Setting up filesystem...";
    case "creating-storageclass": return "Creating storage class...";
    default: return "In progress...";
  }
};

// Helper function to get job phase progress indicator based on actual completion
const getJobPhaseProgress = (phase: string, failed: boolean, completed: boolean, createdResources?: any): string => {
  if (completed && !failed) return "3/3";
  
  if (failed) {
    // Count what was actually completed before failure
    let completedCount = 0;
    
    // Check if LocalDisks were created/used (either new or reused)
    if (createdResources?.localDisks && createdResources.localDisks.length > 0) {
      completedCount++;
    }
    
    // Check if FileSystem was created
    if (createdResources?.fileSystem) {
      completedCount++;
    }
    
    // Check if StorageClass was created  
    if (createdResources?.storageClass) {
      completedCount++;
    }
    
    return `${completedCount}/3`;
  }
  
  // For in-progress jobs, show current phase
  const phases = ["creating-localdisks", "creating-filesystem", "creating-storageclass"];
  const phaseIndex = phases.indexOf(phase);
  
  if (phaseIndex >= 0) {
    return `${phaseIndex + 1}/3`;
  }
  
  return "1/3"; // default for unknown phases
};

export const FileSystemsTabTableRow: React.FC<FileSystemsTabTableRowProps> = (
  props
) => {
  const { activeColumnIDs, obj: entry, rowData } = props;
  const { columns, handleCleanup, routes } = rowData;
  const { t } = useFusionAccessTranslations();

  // Use filesystem view model only for actual filesystem entries
  const vm = entry.type === 'filesystem' && entry.filesystem ? 
    useFileSystemTableRowViewModel(entry.filesystem) : null;

  const kebabMenuActions = useMemo<KebabMenuProps["items"]>(
    () => {
      if (entry.type === 'job') {
        // Show cleanup action for failed jobs
        if (entry.job?.failed) {
          const cleanupTarget: CleanupTarget = {
            type: 'failed-job',
            name: entry.name,
            namespace: entry.job.namespace,
            job: entry.job,
          };
          return [
            {
              key: "cleanup",
              onClick: handleCleanup(cleanupTarget),
              children: t("Cleanup"),
            },
          ];
        }
        return [];
      }
      
      if (!entry.filesystem || !vm) {
        return [];
      }

      // Show cleanup action for filesystem with failed related job
      if (entry.relatedJob?.failed) {
        const cleanupTarget: CleanupTarget = {
          type: 'failed-filesystem',
          name: entry.name,
          namespace: entry.filesystem.metadata?.namespace || '',
          filesystem: entry.filesystem,
          job: entry.relatedJob,
        };
        return [
          {
            key: "cleanup",
            onClick: handleCleanup(cleanupTarget),
            children: t("Cleanup"),
          },
        ];
      }

      // Normal delete action for successful filesystems
      const deleteTarget: CleanupTarget = {
        type: 'filesystem',
        name: entry.name,
        namespace: entry.filesystem.metadata?.namespace || '',
        filesystem: entry.filesystem,
      };
      return [
        {
          key: "delete",
          onClick: handleCleanup(deleteTarget),
          description: vm.isInUse ? <div>{t("Filesystem is in use")}</div> : null,
          children: t("Delete"),
        },
      ];
    },
    [entry, handleCleanup, t, vm]
  );

  // Render job-specific content
  if (entry.type === 'job' && entry.job) {
    const job = entry.job;
    const progress = getJobProgress(job.phase, job.completed, job.failed);
    const statusDescription = getJobStatusDescription(job.phase, job.failed, job.completed);

    return (
      <>
        {/* Name */}
        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[0].id}
          className={columns[0].props.className}
        >
          {entry.name}
        </TableData>

        {/* Status */}
        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[1].id}
          className={columns[1].props.className}
        >
          <FileSystemStatusDetails
            title={statusDescription}
            relatedJob={job}
            filesystemExists={false}
            icon={
              job.failed ? 
                <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> :
              job.completed ?
                <CheckCircleIcon color="var(--pf-global--success-color--100)" /> :
                <InProgressIcon />
            }
          />
        </TableData>

        {/* Raw Capacity - Show -- for jobs without filesystem */}
        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[2].id}
          className={columns[2].props.className}
        >
          <span style={{ color: "var(--pf-global--disabled-color--100)" }}>--</span>
        </TableData>

        {/* StorageClass - Show actual StorageClass or -- */}
        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[3].id}
          className={columns[3].props.className}
        >
          {job.createdResources?.storageClass ? (
            <Label color="green">{job.createdResources.storageClass}</Label>
          ) : (
            <span style={{ color: "var(--pf-global--disabled-color--100)" }}>--</span>
          )}
        </TableData>

        {/* Dashboard Link - Show -- when not available */}
        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[4].id}
          className={columns[4].props.className}
        >
          <span style={{ color: "var(--pf-global--disabled-color--100)" }}>--</span>
        </TableData>

        {/* Actions */}
        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[5].id}
          className={columns[5].props.className}
        >
          <KebabMenu
            isDisabled={!entry.job?.failed}  // Enable for failed jobs
            items={kebabMenuActions}
          />
        </TableData>
      </>
    );
  }

  // Render filesystem-specific content (existing logic)
  if (entry.type === 'filesystem' && entry.filesystem && vm) {
    const fileSystem = entry.filesystem;
    const relatedJob = entry.relatedJob;

    return (
      <>
        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[0].id}
          className={columns[0].props.className}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{vm.name}</span>
            {relatedJob && (
              (() => {
                const progress = getJobPhaseProgress(relatedJob.phase, relatedJob.failed, relatedJob.completed, relatedJob.createdResources);
                if (relatedJob.failed) {
                  return (
                    <Label color="red" isCompact>
                      {progress} Failed
                    </Label>
                  );
                } else if (!relatedJob.completed) {
                  return (
                    <Label color="blue" isCompact>
                      {progress}
                    </Label>
                  );
                }
                return null;
              })()
            )}
          </div>
        </TableData>

        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[1].id}
          className={columns[1].props.className}
        >
          <FileSystemStatusDetails
            title={relatedJob && relatedJob.failed ? 
              `Failed (Creation failed at ${relatedJob.phase})` : 
              vm.title}
            relatedJob={relatedJob}
            filesystemObjectDescription={vm.description}
            filesystemExists={true}
            icon={relatedJob && relatedJob.failed ? 
              <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> :
              <vm.Icon />}
          />
        </TableData>

        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[2].id}
          className={columns[2].props.className}
        >
          {vm.rawCapacity}
        </TableData>

        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[3].id}
          className={columns[3].props.className}
        >
          <FileSystemStorageClasses
            isNotAvailable={vm.status !== "ready"}
            fileSystem={fileSystem}
            storageClasses={vm.storageClasses.data}
          />
        </TableData>

        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[4].id}
          className={columns[4].props.className}
        >
          <FileSystemsDashboardLink
            isNotAvailable={vm.status !== "ready"}
            fileSystem={fileSystem}
            routes={routes.data}
          />
        </TableData>

        <TableData
          activeColumnIDs={activeColumnIDs}
          id={columns[5].id}
          className={columns[5].props.className}
        >
          {!vm.persistentVolumeClaims.loaded ? (
            <Skeleton screenreaderText={t("Loading actions")} />
          ) : (
            <KebabMenu
              isDisabled={["deleting", "creating"].includes(vm.status) && !relatedJob?.failed}
              items={kebabMenuActions}
            />
          )}
        </TableData>
      </>
    );
  }

  // Fallback (shouldn't happen)
  return (
    <>
      {columns.map((column, index) => (
        <TableData
          key={column.id}
          activeColumnIDs={activeColumnIDs}
          id={column.id}
          className={column.props.className}
        >
          {index === 0 ? entry.name : ""}
        </TableData>
      ))}
    </>
  );
};
FileSystemsTabTableRow.displayName = "FileSystemsTabTableRow";
