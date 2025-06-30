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
import type { FileSystemsTableViewModel } from "../hooks/useFileSystemsTableViewModel";
import { useDeleteFileSystemsHandler } from "../hooks/useDeleteFileSystemHandler";
import { useCallback } from "react";

interface FileSystemsDeleteModalProps {
  vm: FileSystemsTableViewModel["deleteModal"];
}

export const FileSystemsDeleteModal: React.FC<FileSystemsDeleteModalProps> = (
  props
) => {
  const { vm } = props;

  const { t } = useFusionAccessTranslations();

  const handleDeleteFileSystem = useDeleteFileSystemsHandler(vm);

  const handleClose = useCallback(() => vm.setIsOpen(false), [vm]);

  return (
    <Modal
      isOpen={vm.isOpen}
      aria-describedby="delete-filesystem-confirmation-modal"
      aria-labelledby="delete-filesystem-title"
      variant="medium"
      onClose={handleClose}
    >
      <ModalHeader
        title={t("Delete Filesystem?")}
        titleIconVariant="warning"
        labelId="delete-filesystem-title"
      />
      <ModalBody tabIndex={0} id="delete-filesystem-confirmation-modal">
        <Stack hasGutter>
          <StackItem isFilled>
            {!vm.errors.length ? (
              <Trans t={t} ns="public">
                Are you sure you want to delete{" "}
                <strong>
                  {{ resourceName: vm.fileSystem?.metadata?.name }}
                </strong>{" "}
                in namespace{" "}
                <strong>
                  {{ namespace: vm.fileSystem?.metadata?.namespace }}
                </strong>
                ?
              </Trans>
            ) : null}
          </StackItem>
          {(vm.errors ?? []).length > 0 && (
            <StackItem>
              <Alert
                isInline
                variant="danger"
                title={t("An error occurred while deleting resources.")}
              >
                <Stack>
                  {vm.errors.map((e, index) => (
                    <StackItem key={index}>{e}</StackItem>
                  ))}
                </Stack>
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        {!vm.errors.length ? (
          <Button
            id="modal-cta-button"
            key="confirm"
            variant="danger"
            onClick={async () => {
              await handleDeleteFileSystem();
            }}
            isLoading={vm.isDeleting}
            isDisabled={vm.isDeleting}
          >
            {vm.isDeleting ? t("Deleting") : t("Confirm")}
          </Button>
        ) : (
          <Button
            id="modal-cta-button"
            key="ok"
            variant="primary"
            onClick={handleClose}
            isLoading={vm.isDeleting}
            isDisabled={vm.isDeleting}
          >
            {t("OK")}
          </Button>
        )}
        {vm.isDeleting ? null : (
          <Button
            id="modal-cancel-button"
            key="cancel"
            variant="link"
            onClick={handleClose}
          >
            {t("Cancel")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
FileSystemsDeleteModal.displayName = "FilesystemsDeleteModal";
