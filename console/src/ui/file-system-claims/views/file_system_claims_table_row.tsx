import {
  ResourceLink,
  type RowProps,
  type TableColumn,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import { SPECTRUM_SCALE_NAMESPACE } from "@/constants";
import { groupVersionKind } from "@/data/models/file_system_claim_gvk";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import { useFileSystemClaimsTableRowViewModel } from "../view-models/use_file_system_claims_table_row_view_model";
import { FileSystemsDashboardLink } from "./file_system_claims_dashboard_link";
import { FileSystemsStatus } from "./file_system_claims_status";

export interface RowData {
  columns: TableColumn<FileSystemClaim>[];
}

type FileSystemClaimsTableRowProps = RowProps<FileSystemClaim, RowData>;

export const FileSystemClaimsTableRow: React.FC<
  FileSystemClaimsTableRowProps
> = (props) => {
  const { activeColumnIDs, obj: fileSystemClaim, rowData } = props;
  const { columns } = rowData;
  const vm = useFileSystemClaimsTableRowViewModel(fileSystemClaim!);

  return (
    <>
      <TableData activeColumnIDs={activeColumnIDs} id={columns[0].id}>
        <ResourceLink
          groupVersionKind={groupVersionKind}
          truncate
          name={vm.fileSystemName}
          namespace={SPECTRUM_SCALE_NAMESPACE}
        />
      </TableData>

      <TableData activeColumnIDs={activeColumnIDs} id={columns[1].id}>
        <FileSystemsStatus
          fileSystemName={vm.fileSystemName}
          title={vm.status.title}
          message={vm.status.message}
          icon={<vm.status.Icon />}
        />
      </TableData>

      <TableData activeColumnIDs={activeColumnIDs} id={columns[2].id}>
        {vm.rawCapacity}
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[3].id}
        className={columns[3].props.className}
      >
        <FileSystemsDashboardLink fileSystemName={vm.fileSystemName} />
      </TableData>
    </>
  );
};
FileSystemClaimsTableRow.displayName = "FileSystemClaimsTableRow";
