import * as React from "react";
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
import type { FileSystemsTabViewModel } from "../hooks/useFileSystemsTabViewModel";
import { useDeleteFileSystemsHandler } from "../hooks/useDeleteFileSystemHandler";

interface FileSystemsDeleteModalProps {
  vm: FileSystemsTabViewModel["deleteModal"];
}

export const FileSystemsDeleteModal: React.FC<FileSystemsDeleteModalProps> = (
  props
) => {
  const { vm } = props;
  const { t } = useFusionAccessTranslations();
  const handleDeleteFileSystem = useDeleteFileSystemsHandler(vm);

  return (
    <Modal
      isOpen={vm.state.isOpen}
      aria-describedby="modal-delete-filesystem"
      variant="medium"
    >
      <ModalHeader title={t("Delete Filesystem?")} titleIconVariant="warning" />
      <ModalBody>
        <Stack hasGutter>
          <StackItem isFilled>
            <Trans t={t} ns="public">
              Are you sure you want to delete{" "}
              <strong>
                {{ resourceName: vm.state.fileSystem?.metadata?.name }}
              </strong>{" "}
              in namespace{" "}
              <strong>
                {{ namespace: vm.state.fileSystem?.metadata?.namespace }}
              </strong>
              ?
            </Trans>
          </StackItem>
          {(vm.state.errors ?? []).length > 0 && (
            <StackItem>
              <Alert
                isInline
                variant="danger"
                title={t("An error occurred while deleting resources.")}
              >
                <Stack>
                  {vm.state.errors.map((e, index) => (
                    <StackItem key={index}>{e}</StackItem>
                  ))}
                </Stack>
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          key="confirm"
          variant="danger"
          onClick={async () => {
            vm.actions.setIsDeleting(true);
            await handleDeleteFileSystem();
          }}
          isLoading={vm.state.isDeleting}
          isDisabled={vm.state.isDeleting}
        >
          {vm.state.isDeleting ? t("Deleting") : t("Delete")}
        </Button>
        {!vm.state.isDeleting && (
          <Button
            key="cancel"
            variant="link"
            onClick={() => vm.actions.setIsOpen(false)}
            isDisabled={vm.state.isDeleting}
          >
            {t("Cancel")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
FileSystemsDeleteModal.displayName = "FilesystemsDeleteModal";
