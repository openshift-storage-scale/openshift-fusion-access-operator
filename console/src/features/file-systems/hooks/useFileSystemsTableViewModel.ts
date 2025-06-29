import { useCallback, useMemo } from "react";
import { type TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchFileSystem } from "@/shared/hooks/useWatchFileSystems";
import { useDeleteModalSlice } from "./useDeleteModalSlice";
import { useRoutesSlice } from "./useRoutesSlice";

export const useFileSystemsTableViewModel = () => {
  const { t } = useFusionAccessTranslations();

  const columns: TableColumn<FileSystem>[] = useMemo(
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

  const deleteModal = useDeleteModalSlice();

  const handleDelete = useCallback(
    (fileSystem: FileSystem) => () => {
      deleteModal.setFileSystem(fileSystem);
      deleteModal.setIsOpen(true);
    },
    [deleteModal]
  );

  const fileSystems = useWatchFileSystem();

  const routes = useRoutesSlice();

  return useMemo(
    () =>
      ({
        columns,
        deleteModal,
        fileSystems,
        handleDelete,
        routes,
      }) as const,
    [columns, deleteModal, fileSystems, handleDelete, routes]
  );
};

export type FileSystemsTableViewModel = ReturnType<
  typeof useFileSystemsTableViewModel
>;
