import * as React from "react";
import { Trans } from "react-i18next";
import { Alert, Button, Modal, Stack, StackItem } from "@patternfly/react-core";
import {
  k8sDelete,
  k8sGet,
  k8sPatch,
  type StorageClass,
  useK8sModel,
  useK8sWatchResource,
} from "@openshift-console/dynamic-plugin-sdk";

import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { FS_ALLOW_DELETE_LABEL } from "@/constants";
import { FileSystemTableContext } from "@/features/file-systems/contexts/FileSystemsTableContext";
import { getFileSystemScs } from "@/features/file-systems/utils/filesystem";

interface FilesystemsDeleteModalProps {
  onClose: VoidFunction;
  filesystem: FileSystem;
}

const FileSystemsDeleteModal: React.FC<FilesystemsDeleteModalProps> = ({
  onClose,
  filesystem,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>();
  const { t } = useFusionAccessTranslations();
  const [fileSystemModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "Filesystem",
  });

  const [localDiskModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "LocalDisk",
  });

  const [storageClassModel] = useK8sModel({
    group: "storage.k8s.io",
    version: "v1",
    kind: "StorageClass",
  });

  const [scs, scsLoaded, scsError] = useK8sWatchResource<StorageClass[]>({
    groupVersionKind: {
      kind: "StorageClass",
      group: "storage.k8s.io",
      version: "v1",
    },
    isList: true,
    namespaced: false,
  });

  const onDelete = async () => {
    setIsDeleting(true);
    setErrors(undefined);
    try {
      if (filesystem.metadata?.labels?.[FS_ALLOW_DELETE_LABEL] == undefined) {
        await k8sPatch({
          model: fileSystemModel,
          ns: filesystem.metadata?.namespace,
          resource: filesystem,
          data: [
            {
              op: "add",
              path: "/metadata/labels",
              value: { [FS_ALLOW_DELETE_LABEL]: "" },
            },
          ],
        });
      }

      await k8sDelete({
        model: fileSystemModel,
        ns: filesystem.metadata?.namespace,
        resource: filesystem,
      });

      const fileSystemScs = getFileSystemScs(filesystem, scs);

      await Promise.allSettled(
        fileSystemScs.map((sc) =>
          k8sDelete({
            model: storageClassModel,
            resource: sc,
          })
        )
      );

      const disks = [
        ...(filesystem.spec?.local?.pools.reduce((disks, pool) => {
          pool.disks.forEach((d) => disks.add(d));
          return disks;
        }, new Set<string>()) || []),
      ];

      if (disks.length) {
        // This is a temporary workaround. We need to clean-up the LocalDisk-s too
        // There is a webhook that disallows deleting LocalDisks if FileSystem still exists
        // We periodically check if the FileSystem still exists. Once it is gone, we delete the LocalDisk-s
        let exists = true;
        while (exists) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          try {
            await k8sGet({
              model: fileSystemModel,
              ns: filesystem.metadata?.namespace,
              name: filesystem.metadata?.name,
            });
          } catch {
            exists = false;
          }
        }

        const diskDeletions = await Promise.allSettled(
          disks.map((d) =>
            k8sDelete({
              model: localDiskModel,
              ns: filesystem.metadata?.namespace,
              resource: {
                metadata: {
                  namespace: filesystem.metadata?.namespace,
                  name: d,
                },
              },
            })
          )
        );

        const failedDiskRemovals = diskDeletions.some(
          (d) => d.status === "rejected"
        );
        if (failedDiskRemovals) {
          setIsDeleting(false);
          setErrors([
            t("Failed to delete the following local disks:"),
            ...diskDeletions.reduce((acc, curr, idx) => {
              if (curr.status === "rejected") {
                const description =
                  curr.reason instanceof Error
                    ? curr.reason.message
                    : (curr.reason as string);
                acc.push(`${disks?.[idx] || ""} - ${description}`);
              }
              return acc;
            }, [] as string[]),
          ]);
          return;
        }
      }
      onClose();
    } catch (e) {
      setIsDeleting(false);
      const description = e instanceof Error ? e.message : (e as string);
      setErrors([description]);
    }
  };

  return (
    <Modal
      title={t("Delete Filesystem?")}
      titleIconVariant="warning"
      isOpen
      aria-describedby="modal-delete-filesystem"
      onClose={() => !isDeleting && onClose()}
      actions={[
        <Button
          key="confirm"
          variant="danger"
          onClick={onDelete}
          isLoading={isDeleting}
          isDisabled={isDeleting}
        >
          {isDeleting ? t("Deleting") : t("Delete")}
        </Button>,
        <Button
          key="cancel"
          variant="link"
          onClick={onClose}
          isDisabled={isDeleting}
        >
          {t("Cancel")}
        </Button>,
      ]}
      variant="medium"
    >
      <Stack hasGutter>
        <StackItem isFilled>
          <Trans t={t} ns="public">
            Are you sure you want to delete{" "}
            <strong>{{ resourceName: filesystem.metadata?.name }}</strong> from
            namespace{" "}
            <strong>{{ resourceNs: filesystem.metadata?.namespace }}</strong>?
          </Trans>
        </StackItem>
        {errors?.length && (
          <StackItem>
            <Alert
              isInline
              variant="danger"
              title={t("An error occurred while deleting resources.")}
            >
              <Stack>
                {errors.map((e, index) => (
                  <StackItem key={index}>{e}</StackItem>
                ))}
              </Stack>
            </Alert>
          </StackItem>
        )}
      </Stack>
    </Modal>
  );
};
FileSystemsDeleteModal.displayName = "FilesystemsDeleteModal";

export const ConnectedFileSystemsDeleteModal: React.FC = () => {
  const { filesystem, setFileSystem } = React.useContext(
    FileSystemTableContext
  );

  return filesystem ? (
    <FileSystemsDeleteModal
      filesystem={filesystem}
      onClose={() => setFileSystem(undefined)}
    />
  ) : null;
};
ConnectedFileSystemsDeleteModal.displayName = "ConnectedFileSystemsDeleteModal";
