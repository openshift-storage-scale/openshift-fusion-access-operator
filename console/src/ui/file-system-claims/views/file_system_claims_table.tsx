import { VirtualizedTable } from "@openshift-console/dynamic-plugin-sdk";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import { useFileSystemClaimsTableViewModel } from "../view-models/use_file_system_claims_table_view_model";
import { FileSystemClaimsTableEmptyState } from "./file_system_claims_table_empty_state";
import {
  FileSystemClaimsTableRow,
  type RowData,
} from "./file_system_claims_table_row";

export const FileSystemClaimsTable: React.FC = () => {
  const vm = useFileSystemClaimsTableViewModel();
  const { columns } = vm;

  return (
    <VirtualizedTable<FileSystemClaim, RowData>
      columns={vm.columns}
      data={vm.fileSystemClaims}
      unfilteredData={vm.fileSystemClaims}
      loaded={vm.loaded}
      loadError={vm.error}
      EmptyMsg={FileSystemClaimsTableEmptyState}
      Row={FileSystemClaimsTableRow}
      rowData={{ columns }}
    />
  );
};
FileSystemClaimsTable.displayName = "FileSystemClaimsTable";
