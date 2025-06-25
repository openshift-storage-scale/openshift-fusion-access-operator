import { VirtualizedTable } from "@openshift-console/dynamic-plugin-sdk";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { FileSystemsDeleteModal } from "./FileSystemsDeleteModal";
import { FileSystemsTableEmptyState } from "./FileSystemsTableEmptyState";
import { FileSystemsTabTableRow } from "./FileSystemsTableRow";
import {
  useFileSystemsTableViewModel,
  type FileSystemsTableViewModel,
} from "../hooks/useFileSystemsTableViewModel";

export const FileSystemsTable: React.FC = () => {
  const vm = useFileSystemsTableViewModel();

  const { columns, deleteModal, routes } = vm;

  return (
    <>
      <VirtualizedTable<
        FileSystem,
        Pick<FileSystemsTableViewModel, "columns" | "deleteModal" | "routes">
      >
        columns={vm.columns}
        data={vm.fileSystems.data ?? []}
        unfilteredData={vm.fileSystems.data ?? []}
        loaded={vm.fileSystems.loaded}
        loadError={vm.fileSystems.error}
        EmptyMsg={FileSystemsTableEmptyState}
        Row={FileSystemsTabTableRow}
        rowData={{ columns, deleteModal, routes }}
      />
      <FileSystemsDeleteModal vm={vm.deleteModal} />
    </>
  );
};
FileSystemsTable.displayName = "FileSystemsTable";
