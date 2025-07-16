import { VirtualizedTable } from "@openshift-console/dynamic-plugin-sdk";
import type { UnifiedFilesystemEntry } from "../hooks/useFileSystemsTableViewModel";
import { CleanupModal } from "./CleanupModal";
import { FileSystemsTableEmptyState } from "./FileSystemsTableEmptyState";
import { FileSystemsTabTableRow, type RowData } from "./FileSystemsTableRow";
import { useFileSystemsTableViewModel } from "../hooks/useFileSystemsTableViewModel";

export const FileSystemsTable: React.FC = () => {
  const vm = useFileSystemsTableViewModel();

  const { columns, cleanupModal, routes } = vm;

  const { handleCleanup } = cleanupModal;

  return (
    <>
      <VirtualizedTable<UnifiedFilesystemEntry, RowData>
        columns={vm.columns}
        data={vm.fileSystems.data ?? []}
        unfilteredData={vm.fileSystems.data ?? []}
        loaded={vm.fileSystems.loaded}
        loadError={vm.fileSystems.error}
        EmptyMsg={FileSystemsTableEmptyState}
        Row={FileSystemsTabTableRow}
        rowData={{ columns, handleCleanup, routes }}
      />
      <CleanupModal
        target={cleanupModal.target}
        isOpen={cleanupModal.isOpen}
        isProcessing={cleanupModal.isProcessing}
        errors={cleanupModal.errors}
        onClose={cleanupModal.handleClose}
        onSetProcessing={cleanupModal.setIsProcessing}
        onSetErrors={cleanupModal.setErrors}
      />
    </>
  );
};
FileSystemsTable.displayName = "FileSystemsTable";
