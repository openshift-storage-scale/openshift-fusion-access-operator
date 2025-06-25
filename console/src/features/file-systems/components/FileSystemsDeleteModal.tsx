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
      aria-describedby="modal-delete-filesystem"
      variant="medium"
    >
      <ModalHeader title={t("Delete Filesystem?")} titleIconVariant="warning" />
      <ModalBody>
        <Stack hasGutter>
          <StackItem isFilled>
            <Trans t={t} ns="public">
              Are you sure you want to delete{" "}
              <strong>{{ resourceName: vm.fileSystem?.metadata?.name }}</strong>{" "}
              in namespace{" "}
              <strong>
                {{ namespace: vm.fileSystem?.metadata?.namespace }}
              </strong>
              ?
            </Trans>
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
        <Button
          key="confirm"
          variant="danger"
          onClick={async () => {
            await handleDeleteFileSystem();
          }}
          isLoading={vm.isDeleting}
          isDisabled={vm.isDeleting}
        >
          {vm.isDeleting ? t("Deleting") : t("Delete")}
        </Button>
        {!vm.isDeleting && (
          <Button
            key="cancel"
            variant="link"
            onClick={() => vm.setIsOpen(false)}
            isDisabled={vm.isDeleting}
          >
            {t("Cancel")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
FileSystemsDeleteModal.displayName = "FilesystemsDeleteModal";
