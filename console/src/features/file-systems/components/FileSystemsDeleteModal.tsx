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

interface FileSystemsDeleteModalProps {
  vm: FileSystemsTableViewModel["deleteModal"];
}

export const FileSystemsDeleteModal: React.FC<FileSystemsDeleteModalProps> = (
  props
) => {
  const { vm } = props;

  const { t } = useFusionAccessTranslations();

  const handleDeleteFileSystem = useDeleteFileSystemsHandler(vm);

  return (
    <Modal
      isOpen={vm.isOpen}
      aria-describedby="filesystem-delete-confirmation-modal"
      aria-labelledby="delete-filesystem-title"
      variant="medium"
      onClose={vm.handleClose}
    >
      <ModalHeader
        title={t("Delete File system")}
        titleIconVariant="warning"
        labelId="delete-filesystem-title"
      />
      <ModalBody tabIndex={0} id="filesystem-delete-confirmation-modal">
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
            onClick={handleDeleteFileSystem}
            isLoading={vm.isDeleting}
            isDisabled={vm.isDeleting}
          >
            {vm.isDeleting ? t("Deleting") : t("Delete")}
          </Button>
        ) : (
          <Button
            id="modal-cta-button"
            key="ok"
            variant="primary"
            onClick={vm.handleClose}
            isLoading={vm.isDeleting}
            isDisabled={vm.isDeleting}
          >
            {t("Close")}
          </Button>
        )}
        {vm.isDeleting ? null : (
          <Button
            id="modal-cancel-button"
            key="cancel"
            variant="link"
            onClick={vm.handleClose}
          >
            {t("Cancel")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
FileSystemsDeleteModal.displayName = "FilesystemsDeleteModal";
