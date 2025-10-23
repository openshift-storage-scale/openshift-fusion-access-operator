import { VirtualizedTable } from "@openshift-console/dynamic-plugin-sdk";
import type { Filesystem } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Filesystem";
import { FileSystemsDeleteModal } from "./FileSystemsDeleteModal";
import { FileSystemsTableEmptyState } from "./FileSystemsTableEmptyState";
import { FileSystemsTabTableRow, type RowData } from "./FileSystemsTableRow";
import { useFileSystemsTableViewModel } from "../hooks/useFileSystemsTableViewModel";

export const FileSystemsTable: React.FC = () => {
  const vm = useFileSystemsTableViewModel();

  const { columns, deleteModal, routes } = vm;

  const { handleDelete } = deleteModal;

  return (
    <>
      <VirtualizedTable<Filesystem, RowData>
        columns={vm.columns}
        data={vm.fileSystems.data ?? []}
        unfilteredData={vm.fileSystems.data ?? []}
        loaded={vm.fileSystems.loaded}
        loadError={vm.fileSystems.error}
        EmptyMsg={FileSystemsTableEmptyState}
        Row={FileSystemsTabTableRow}
        rowData={{ columns, handleDelete, routes }}
      />
      <FileSystemsDeleteModal vm={vm.deleteModal} />
    </>
  );
};
FileSystemsTable.displayName = "FileSystemsTable";
