import { VirtualizedTable } from "@openshift-console/dynamic-plugin-sdk";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { FileSystemsDeleteModal } from "./FileSystemsDeleteModal";
import { FileSystemsTableEmptyState } from "./FileSystemsTableEmptyState";
import { FileSystemsTabTableRow } from "./FileSystemsTableRow";
import { useFileSystemsTabViewModel, type FileSystemsTabViewModel } from "../hooks/useFileSystemsTabViewModel";

export const FileSystemsTab: React.FC = () => {
  const vm = useFileSystemsTabViewModel();

  return (
    <>
      <VirtualizedTable<FileSystem, FileSystemsTabViewModel>
        data={vm.fileSystems.state.data ?? []}
        unfilteredData={vm.fileSystems.state.data ?? []}
        loaded={vm.fileSystems.state.loaded}
        loadError={vm.fileSystems.state.error}
        columns={vm.columns}
        EmptyMsg={FileSystemsTableEmptyState}
        Row={FileSystemsTabTableRow}
        rowData={vm}
      />
      <FileSystemsDeleteModal vm={vm.deleteModal} />
    </>
  );
};
FileSystemsTab.displayName = "FileSystemsTab";
