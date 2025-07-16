import React from "react";
import { Button, List, ListItem, Popover } from "@patternfly/react-core";
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InProgressIcon,
  UnknownIcon,
  PendingIcon
} from "@patternfly/react-icons";
import type { FilesystemJobStatus } from "@/shared/hooks/useWatchFilesystemJobs";

interface FileSystemStatusDetailsProps {
  title: string;
  icon: React.ReactNode;
  relatedJob?: FilesystemJobStatus;
  filesystemObjectDescription?: Partial<Record<"Success" | "Healthy", string>>;
  filesystemExists: boolean;
}

interface ComponentStatus {
  name: string;
  status: "created" | "creating" | "failed" | "pending" | "unknown";
  message: string;
  icon: React.ReactNode;
}

const getComponentStatuses = (
  job: FilesystemJobStatus | undefined,
  filesystemExists: boolean,
  filesystemObjectDescription?: Partial<Record<"Success" | "Healthy", string>>
): ComponentStatus[] => {
  if (!job) {
    // No job data - show status for all components when filesystem exists
    if (filesystemExists && filesystemObjectDescription) {
      return [
        {
          name: "LocalDisk",
          status: "unknown",
          message: "Status unknown - no job information available",
          icon: <UnknownIcon />
        },
        {
          name: "FileSystem",
          status: "created",
          message: filesystemObjectDescription.Success || "Created successfully",
          icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />
        },
        {
          name: "StorageClass", 
          status: "unknown",
          message: "Status unknown - no job information available",
          icon: <UnknownIcon />
        }
      ];
    }
    return [];
  }

  const statuses: ComponentStatus[] = [];
  const createdResources = job.createdResources;
  const currentPhase = job.phase;
  const failed = job.failed;
  const completed = job.completed;
  
  // LocalDisk status
  if (createdResources?.localDisks && createdResources.localDisks.length > 0) {
    statuses.push({
      name: "LocalDisk",
      status: "created",
      message: `Using ${createdResources.localDisks.length} LocalDisk(s): ${createdResources.localDisks.join(", ")}`,
      icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />
    });
  } else if (currentPhase === "creating-localdisks" && !failed) {
    statuses.push({
      name: "LocalDisk",
      status: "creating",
      message: "Creating storage disks...",
      icon: <InProgressIcon />
    });
  } else if (failed && (currentPhase === "creating-localdisks" || currentPhase === "starting")) {
    statuses.push({
      name: "LocalDisk",
      status: "failed",
      message: job.phaseDetails?.error || job.phaseDetails?.message || "Failed to create LocalDisks",
      icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
    });
  } else if (currentPhase === "creating-filesystem" || currentPhase === "creating-storageclass" || completed) {
    // If we're past LocalDisk creation phase, assume LocalDisks are ready
    statuses.push({
      name: "LocalDisk",
      status: "created",
      message: "LocalDisk resources ready (details not available)",
      icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />
    });
  } else {
    statuses.push({
      name: "LocalDisk",
      status: "pending",
      message: "Waiting to create storage disks",
      icon: <PendingIcon />
    });
  }

  // FileSystem status
  if (filesystemExists && filesystemObjectDescription) {
    // Show actual filesystem object status
    statuses.push({
      name: "FileSystem",
      status: "created",
      message: filesystemObjectDescription.Success || "Created successfully",
      icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />
    });
  } else if (createdResources?.fileSystem) {
    statuses.push({
      name: "FileSystem", 
      status: "created",
      message: `Created filesystem: ${createdResources.fileSystem}`,
      icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />
    });
  } else if (currentPhase === "creating-filesystem" && !failed) {
    statuses.push({
      name: "FileSystem",
      status: "creating", 
      message: "Setting up filesystem...",
      icon: <InProgressIcon />
    });
  } else if (failed && currentPhase === "creating-filesystem") {
    statuses.push({
      name: "FileSystem",
      status: "failed",
      message: job.phaseDetails?.error || job.phaseDetails?.message || "Failed to create FileSystem",
      icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
    });
  } else if (statuses.some(s => s.name === "LocalDisk" && s.status === "created")) {
    statuses.push({
      name: "FileSystem",
      status: "pending",
      message: "Waiting to create filesystem",
      icon: <PendingIcon />
    });
  } else if (statuses.some(s => s.name === "LocalDisk" && s.status === "failed")) {
    statuses.push({
      name: "FileSystem",
      status: "pending",
      message: "Skipped due to LocalDisk creation failure",
      icon: <PendingIcon />
    });
  } else {
    statuses.push({
      name: "FileSystem",
      status: "pending",
      message: "Waiting for LocalDisk creation",
      icon: <PendingIcon />
    });
  }

  // StorageClass status  
  if (createdResources?.storageClass) {
    statuses.push({
      name: "StorageClass",
      status: "created",
      message: `Created StorageClass: ${createdResources.storageClass}`,
      icon: <CheckCircleIcon color="var(--pf-global--success-color--100)" />
    });
  } else if (currentPhase === "creating-storageclass" && !failed) {
    statuses.push({
      name: "StorageClass",
      status: "creating",
      message: "Creating storage class...",
      icon: <InProgressIcon />
    });
  } else if (failed && currentPhase === "creating-storageclass") {
    statuses.push({
      name: "StorageClass", 
      status: "failed",
      message: job.phaseDetails?.error || job.phaseDetails?.message || "Failed to create StorageClass",
      icon: <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />
    });
  } else if (statuses.some(s => s.name === "FileSystem" && s.status === "created")) {
    statuses.push({
      name: "StorageClass",
      status: "pending", 
      message: "Waiting to create storage class",
      icon: <PendingIcon />
    });
  } else if (statuses.some(s => (s.name === "LocalDisk" || s.name === "FileSystem") && s.status === "failed")) {
    statuses.push({
      name: "StorageClass",
      status: "pending",
      message: "Skipped due to previous failure",
      icon: <PendingIcon />
    });
  } else {
    statuses.push({
      name: "StorageClass",
      status: "pending",
      message: "Waiting for FileSystem creation",
      icon: <PendingIcon />
    });
  }

  return statuses;
};

export const FileSystemStatusDetails: React.FC<FileSystemStatusDetailsProps> = ({
  title,
  icon,
  relatedJob,
  filesystemObjectDescription,
  filesystemExists
}) => {
  const componentStatuses = getComponentStatuses(relatedJob, filesystemExists, filesystemObjectDescription);

  if (componentStatuses.length === 0) {
    // Fallback for cases where no filesystem exists and no job data
    return (
      <>
        {icon} {title}
      </>
    );
  }

  return (
    <Popover
      aria-label="Filesystem creation status details"
      bodyContent={
        <List aria-label="Component creation status" isPlain>
          {componentStatuses.map((component) => (
            <ListItem key={component.name}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                {component.icon}
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {component.name}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--pf-global--Color--200)', marginTop: '2px' }}>
                    {component.message}
                    </div>
                  </div>
                </div>
              </ListItem>
            ))}
            {filesystemExists && filesystemObjectDescription?.Healthy && (
              <ListItem style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--pf-global--BorderColor--100)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Health Status</div>
                    <div style={{ fontSize: '14px', color: 'var(--pf-global--Color--200)', marginTop: '2px' }}>
                      {filesystemObjectDescription.Healthy}
                    </div>
                  </div>
                </div>
              </ListItem>
            )}
        </List>
      }
    >
      <Button variant="link" isInline icon={icon}>
        {title}
      </Button>
    </Popover>
  );
}; 