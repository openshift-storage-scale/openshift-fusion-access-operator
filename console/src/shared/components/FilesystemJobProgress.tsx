import React from "react";
import {
  Progress,
  ProgressMeasureLocation,
  ProgressVariant,
  Card,
  CardBody,
  CardTitle,
  Alert,
  AlertVariant,
  List,
  ListItem,
  Stack,
  StackItem,
  Flex,
  FlexItem,
  Label,
  Spinner,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InProgressIcon,
  PendingIcon,
} from "@patternfly/react-icons";
import type { FilesystemJobStatus } from "@/shared/hooks/useWatchFilesystemJobs";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";

interface FilesystemJobProgressProps {
  job: FilesystemJobStatus;
}

const getPhaseIcon = (phase: string, isActive: boolean, isCompleted: boolean, isFailed: boolean) => {
  if (isFailed) {
    return <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />;
  }
  if (isCompleted) {
    return <CheckCircleIcon color="var(--pf-global--success-color--100)" />;
  }
  if (isActive) {
    return <Spinner size="sm" />;
  }
  return <PendingIcon color="var(--pf-global--disabled-color--100)" />;
};

const getProgressValue = (phase: string, completed: boolean, failed: boolean): number => {
  if (completed) return 100;
  if (failed) {
    // Return progress based on how far we got before failing
    switch (phase) {
      case "starting":
        return 0;
      case "creating-localdisks":
        return 10;
      case "creating-filesystem": 
        return 40;
      case "creating-storageclass":
        return 80;
      default:
        return 0;
    }
  }
  
  switch (phase) {
    case "starting":
      return 5;
    case "creating-localdisks":
      return 25;
    case "creating-filesystem":
      return 60;
    case "creating-storageclass":
      return 90;
    case "completed":
      return 100;
    default:
      return 0;
  }
};

const getProgressVariant = (completed: boolean, failed: boolean): ProgressVariant | undefined => {
  if (completed) return ProgressVariant.success;
  if (failed) return ProgressVariant.danger;
  return undefined; // Default variant
};

export const FilesystemJobProgress: React.FC<FilesystemJobProgressProps> = ({ job }) => {
  const { t } = useFusionAccessTranslations();

  const phases = [
    { 
      key: "creating-localdisks", 
      label: "Creating LocalDisks",
      description: "Setting up local disk resources"
    },
    { 
      key: "creating-filesystem", 
      label: "Creating FileSystem",
      description: "Configuring the storage filesystem"
    },
    { 
      key: "creating-storageclass", 
      label: "Creating StorageClass",
      description: "Setting up Kubernetes StorageClass"
    },
  ];

  const currentPhaseIndex = phases.findIndex(p => job.phase === p.key);
  const progressValue = getProgressValue(job.phase, job.completed, job.failed);
  const progressVariant = getProgressVariant(job.completed, job.failed);

  return (
    <Card>
      <CardTitle>
        <Flex>
          <FlexItem>
            Filesystem Creation: {job.filesystemName}
          </FlexItem>
          <FlexItem align={{ default: "alignRight" }}>
            <Label 
              color={job.completed ? "green" : job.failed ? "red" : "blue"}
              icon={job.completed ? <CheckCircleIcon /> : job.failed ? <ExclamationCircleIcon /> : <InProgressIcon />}
            >
              {job.phase === "completed" ? "Completed" :
               job.phase === "failed" ? "Failed" :
               "In Progress"}
            </Label>
          </FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Progress
              value={progressValue}
              title="Overall Progress"
              measureLocation={ProgressMeasureLocation.top}
              {...(progressVariant && { variant: progressVariant })}
              label={job.phaseDetails?.progress || `${progressValue}%`}
            />
          </StackItem>

          {job.phaseDetails?.message && (
            <StackItem>
              <Alert
                variant={job.failed ? AlertVariant.danger : AlertVariant.info}
                title={job.phaseDetails.message}
                isInline
              />
            </StackItem>
          )}

          {job.phaseDetails?.error && (
            <StackItem>
              <Alert
                variant={AlertVariant.danger}
                title="Error Details"
                isInline
              >
                {job.phaseDetails.error}
              </Alert>
            </StackItem>
          )}

          <StackItem>
            <h4>Creation Phases</h4>
            <List>
              {phases.map((phase, index) => {
                const isActive = job.phase === phase.key;
                const isCompleted = currentPhaseIndex > index || (job.completed && currentPhaseIndex >= index);
                const isFailed = job.failed && currentPhaseIndex === index;
                
                return (
                  <ListItem key={phase.key}>
                    <Flex>
                      <FlexItem>
                        {getPhaseIcon(phase.key, isActive, isCompleted, isFailed)}
                      </FlexItem>
                      <FlexItem>
                        <strong>{phase.label}</strong>
                        <br />
                        <small style={{ color: "var(--pf-global--Color--200)" }}>
                          {phase.description}
                        </small>
                      </FlexItem>
                    </Flex>
                  </ListItem>
                );
              })}
            </List>
          </StackItem>

          {job.createdResources && (
            <StackItem>
              <h4>Created Resources</h4>
              <List>
                {job.createdResources.localDisks.map((disk, index) => (
                  <ListItem key={disk}>
                    <Flex>
                      <FlexItem>
                        <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                      </FlexItem>
                      <FlexItem>
                        LocalDisk: {disk}
                      </FlexItem>
                    </Flex>
                  </ListItem>
                ))}
                {job.createdResources.fileSystem && (
                  <ListItem>
                    <Flex>
                      <FlexItem>
                        <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                      </FlexItem>
                      <FlexItem>
                        FileSystem: {job.createdResources.fileSystem}
                      </FlexItem>
                    </Flex>
                  </ListItem>
                )}
                {job.createdResources.storageClass && (
                  <ListItem>
                    <Flex>
                      <FlexItem>
                        <CheckCircleIcon color="var(--pf-global--success-color--100)" />
                      </FlexItem>
                      <FlexItem>
                        StorageClass: {job.createdResources.storageClass}
                      </FlexItem>
                    </Flex>
                  </ListItem>
                )}
              </List>
            </StackItem>
          )}

          {job.failed && (
            <StackItem>
              <Alert
                variant={AlertVariant.info}
                title="LocalDisks Preserved"
                isInline
              >
                Created LocalDisk resources have been preserved and can be reused in future filesystem creation attempts.
              </Alert>
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}; 