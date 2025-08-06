import { useMemo } from "react";
import { type TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchFileSystem } from "@/shared/hooks/useWatchFileSystem";
import { useDeleteModal } from "./useDeleteModal";
import { useRoutes } from "./useRoutes";

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
      // TODO: Add actions column when we have actions to show (see conversation in https://issues.redhat.com/browse/OCPNAS-217)
      // {
      //   id: "actions",
      //   title: "",
      //   props: { className: "pf-v6-c-table__action" },
      // },
    ],
    [t]
  );

  const deleteModal = useDeleteModal();

  const fileSystems = useWatchFileSystem();

  const routes = useRoutes();

  return useMemo(
    () =>
      ({
        columns,
        deleteModal,
        fileSystems,
        routes,
      }) as const,
    [columns, deleteModal, fileSystems, routes]
  );
};

export type FileSystemsTableViewModel = ReturnType<
  typeof useFileSystemsTableViewModel
>;
