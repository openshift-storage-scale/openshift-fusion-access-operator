import { useMemo } from "react";
import {
  useK8sWatchResource,
  type StorageClass,
  type TableColumn,
} from "@openshift-console/dynamic-plugin-sdk";
import type { IoK8sApiCoreV1PersistentVolumeClaim } from "@/shared/types/kubernetes/1.30/types";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchFileSystem } from "@/shared/hooks/useWatchFileSystems";
import {
  newViewModelSlice,
  type ViewModelSlice,
} from "@/shared/types/internal/ViewModelSlice";
import {
  newLoadableResourceState,
  type LoadableResourceState,
} from "@/shared/types/internal/LoadableResource";
import { useDeleteModalSlice } from "./useDeleteModalSlice";
import { useRoutesSlice } from "./useRoutesSlice";

export interface FileSystemsTabViewModel {
  columns: TableColumn<FileSystem>[];
  deleteModal: ReturnType<typeof useDeleteModalSlice>;
  fileSystems: ViewModelSlice<LoadableResourceState<FileSystem[]>>;
  persistenVolumeClaims: ViewModelSlice<
    LoadableResourceState<IoK8sApiCoreV1PersistentVolumeClaim[]>
  >;
  routes: ReturnType<typeof useRoutesSlice>;
  storageClasses: ViewModelSlice<LoadableResourceState<StorageClass[]>>;
}

export const useFileSystemsTabViewModel = (): FileSystemsTabViewModel => {
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

  const fileSystemsWatchResult = useWatchFileSystem();

  const pvcsWatchResult = useK8sWatchResource<
    IoK8sApiCoreV1PersistentVolumeClaim[]
  >({
    isList: true,
    namespaced: true,
    groupVersionKind: {
      version: "v1",
      kind: "PersistentVolumeClaim",
    },
  });

  const storageClassesWatchResult = useK8sWatchResource<StorageClass[]>({
    isList: true,
    namespaced: true,
    groupVersionKind: {
      group: "storage.k8s.io",
      version: "v1",
      kind: "StorageClass",
    },
  });

  const routes = useRoutesSlice();

  const deleteModal = useDeleteModalSlice({
    isOpen: false,
    isDeleting: false,
    errors: [],
  });

  return useMemo(
    () => ({
      columns,
      deleteModal,
      fileSystems: newViewModelSlice(
        newLoadableResourceState(fileSystemsWatchResult)
      ),
      persistenVolumeClaims: newViewModelSlice(
        newLoadableResourceState(pvcsWatchResult)
      ),
      storageClasses: newViewModelSlice(
        newLoadableResourceState(storageClassesWatchResult)
      ),
      routes,
    }),
    [
      columns,
      deleteModal,
      fileSystemsWatchResult,
      pvcsWatchResult,
      routes,
      storageClassesWatchResult,
    ]
  );
};
