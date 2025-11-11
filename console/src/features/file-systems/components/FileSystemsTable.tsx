import { VirtualizedTable } from "@openshift-console/dynamic-plugin-sdk";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import type { Filesystem } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Filesystem";
import { useFileSystemsTableViewModel } from "../hooks/useFileSystemsTableViewModel";
import { FileSystemsTableEmptyState } from "./FileSystemsTableEmptyState";
import { FileSystemsTabTableRow, type RowData } from "./FileSystemsTableRow";

export const FileSystemsTable: React.FC = () => {
  const vm = useFileSystemsTableViewModel();
  const { columns } = vm;

  return (
    <VirtualizedTable<Filesystem, RowData>
      columns={vm.columns}
      data={vm.fileSystems}
      unfilteredData={vm.fileSystems}
      loaded={vm.loaded}
      loadError={vm.error}
      EmptyMsg={FileSystemsTableEmptyState}
      Row={FileSystemsTabTableRow}
      rowData={{ columns }}
    />
  );
};
FileSystemsTable.displayName = "FileSystemsTable";
