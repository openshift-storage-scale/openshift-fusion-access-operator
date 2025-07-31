import { Trans } from "react-i18next";
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useCleanupHandler, type CleanupTarget } from "../hooks/useCleanupHandler";

interface CleanupModalProps {
  target?: CleanupTarget;
  isOpen: boolean;
  isProcessing: boolean;
  errors: string[];
  onClose: () => void;
  onSetProcessing: (isProcessing: boolean) => void;
  onSetErrors: (errors: string[]) => void;
}

export const CleanupModal: React.FC<CleanupModalProps> = (props) => {
  const { target, isOpen, isProcessing, errors, onClose, onSetProcessing, onSetErrors } = props;
  const { t } = useFusionAccessTranslations();

  const handleCleanup = useCleanupHandler(target, () => {
    // On successful completion, just close the modal
    onClose();
  });

  const executeCleanup = async () => {
    if (!target) return;

    onSetErrors([]);
    onSetProcessing(true);

    try {
      await handleCleanup();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : (e as string);
      onSetErrors(errorMessage.split('\n').filter(msg => msg.trim()));
    } finally {
      onSetProcessing(false);
    }
  };

  if (!target) {
    return null;
  }

  const getModalTitle = () => {
    switch (target.type) {
      case 'failed-job':
        return t("Clean up failed job");
      case 'failed-filesystem':
        return t("Clean up filesystem");
      case 'filesystem':
        return t("Delete filesystem");
      default:
        return t("Cleanup");
    }
  };

  const getConfirmationMessage = () => {
    switch (target.type) {
      case 'failed-job':
        return (
          <Trans t={t} ns="public">
            Are you sure you want to clean up the failed job for{" "}
            <strong>{{ resourceName: target.name }}</strong>?
            <br />
            This will remove the job and any partially created resources
            (LocalDisks, FileSystem, StorageClass) that were created by this job.
          </Trans>
        );
      case 'failed-filesystem':
        return (
          <Trans t={t} ns="public">
            Are you sure you want to clean up{" "}
            <strong>{{ resourceName: target.name }}</strong>?
            <br />
            This will remove the failed creation job and delete the filesystem
            along with all associated resources.
          </Trans>
        );
      case 'filesystem':
        return (
          <Trans t={t} ns="public">
            Are you sure you want to delete{" "}
            <strong>{{ resourceName: target.name }}</strong>{" "}
            in namespace{" "}
            <strong>{{ namespace: target.namespace }}</strong>?
            <br />
            This will delete the filesystem and all associated LocalDisks and StorageClasses.
          </Trans>
        );
      default:
        return t("Are you sure you want to proceed?");
    }
  };

  const getActionButtonText = () => {
    if (isProcessing) {
      switch (target.type) {
        case 'failed-job':
          return t("Cleaning up...");
        case 'failed-filesystem':
          return t("Cleaning up...");
        case 'filesystem':
          return t("Deleting...");
        default:
          return t("Processing...");
      }
    }

    switch (target.type) {
      case 'failed-job':
        return t("Clean up");
      case 'failed-filesystem':
        return t("Clean up");
      case 'filesystem':
        return t("Delete");
      default:
        return t("Confirm");
    }
  };

  const getVariant = () => {
    return target.type === 'filesystem' ? 'danger' : 'warning';
  };

  return (
    <Modal
      isOpen={isOpen}
      aria-describedby="cleanup-confirmation-modal"
      aria-labelledby="cleanup-modal-title"
      variant="medium"
      onClose={onClose}
    >
      <ModalHeader
        title={getModalTitle()}
        titleIconVariant={getVariant()}
        labelId="cleanup-modal-title"
      />
      <ModalBody tabIndex={0} id="cleanup-confirmation-modal">
        <Stack hasGutter>
          <StackItem isFilled>
            {!errors.length ? getConfirmationMessage() : null}
          </StackItem>
          {errors.length > 0 && (
            <StackItem>
              <Alert
                isInline
                variant="danger"
                title={t("An error occurred during the operation.")}
              >
                <Stack>
                  {errors.map((error, index) => (
                    <StackItem key={index}>{error}</StackItem>
                  ))}
                </Stack>
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        {!errors.length ? (
          <Button
            id="modal-cta-button"
            key="confirm"
            variant={getVariant()}
            onClick={executeCleanup}
            isLoading={isProcessing}
            isDisabled={isProcessing}
          >
            {getActionButtonText()}
          </Button>
        ) : (
          <Button
            id="modal-cta-button"
            key="ok"
            variant="primary"
            onClick={onClose}
            isLoading={isProcessing}
            isDisabled={isProcessing}
          >
            {t("Close")}
          </Button>
        )}
        {isProcessing ? null : (
          <Button
            id="modal-cancel-button"
            key="cancel"
            variant="link"
            onClick={onClose}
          >
            {t("Cancel")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

CleanupModal.displayName = "CleanupModal"; 