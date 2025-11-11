import {
  type K8sResourceCommon,
  ResourceLink,
  type RowProps,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import type { Filesystem } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Filesystem";
import type { FileSystemsTableViewModel } from "../hooks/useFileSystemsTableViewModel";
import { useFileSystemTableRowViewModel } from "../hooks/useFileSystemTableRowViewModel";
import { useRoutes } from "../hooks/useRoutes";
import { FileSystemsDashboardLink } from "./FileSystemsDashboardLink";
import { FileSystemsStatus } from "./FileSystemsStatus";
import { FileSystemStorageClasses } from "./FileSystemsStorageClasses";

export type RowData = Pick<FileSystemsTableViewModel, "columns">;

type FileSystemsTabTableRowProps = RowProps<Filesystem, RowData>;

export const FileSystemsTabTableRow: React.FC<FileSystemsTabTableRowProps> = (
  props,
) => {
  const { activeColumnIDs, obj: fileSystem, rowData } = props;
  const { columns } = rowData;
  const vm = useFileSystemTableRowViewModel(fileSystem!);
  const routes = useRoutes();

  return (
    <>
      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[0].id}
        className={columns[0].props.className}
      >
        <ResourceLink
          groupVersionKind={{
            group: "fusion.storage.openshift.io",
            version: "v1alpha1",
            kind: "FileSystemClaim",
          }}
          name={vm.name}
          namespace="ibm-spectrum-scale"
        />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[1].id}
        className={columns[1].props.className}
      >
        <FileSystemsStatus
          title={vm.title}
          description={vm.description}
          icon={<vm.Icon />}
        />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[2].id}
        className={columns[2].props.className}
      >
        {vm.rawCapacity}
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[3].id}
        className={columns[3].props.className}
      >
        <FileSystemStorageClasses
          isNotAvailable={vm.status !== "ready"}
          fileSystem={fileSystem}
          storageClasses={vm.storageClasses.data}
        />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[4].id}
        className={columns[4].props.className}
      >
        <FileSystemsDashboardLink
          isNotAvailable={vm.status !== "ready"}
          fileSystem={fileSystem}
          routes={routes.data}
        />
      </TableData>
    </>
  );
};
FileSystemsTabTableRow.displayName = "FileSystemsTabTableRow";
