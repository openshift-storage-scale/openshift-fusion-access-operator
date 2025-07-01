import { useMemo } from "react";
import {
  type RowProps,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import { Skeleton } from "@patternfly/react-core";
import { KebabMenu, type KebabMenuProps } from "@/shared/components/KebabMenu";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import type { FileSystemsTableViewModel } from "../hooks/useFileSystemsTableViewModel";
import { useFileSystemTableRowViewModel } from "../hooks/useFileSystemTableRowViewModel";
import { FileSystemsDashboardLink } from "./FileSystemsDashboardLink";
import { FileSystemStorageClasses } from "./FileSystemsStorageClasses";
import { FileSystemStatus } from "./FileSystemsStatus";

export type RowData = Pick<FileSystemsTableViewModel, "columns" | "routes"> &
  Pick<FileSystemsTableViewModel["deleteModal"], "handleDelete">;

type FileSystemsTabTableRowProps = RowProps<FileSystem, RowData>;

export const FileSystemsTabTableRow: React.FC<FileSystemsTabTableRowProps> = (
  props
) => {
  const { activeColumnIDs, obj: fileSystem, rowData } = props;

  const { columns, handleDelete, routes } = rowData;

  const vm = useFileSystemTableRowViewModel(fileSystem);

  const { t } = useFusionAccessTranslations();

  const kebabMenuActions = useMemo<KebabMenuProps["items"]>(
    () => [
      {
        key: "delete",
        onClick: handleDelete(fileSystem),
        description: vm.isInUse ? <div>{t("Filesystem is in use")}</div> : null,
        children: t("Delete"),
      },
    ],
    [fileSystem, handleDelete, t, vm.isInUse]
  );

  return (
    <>
      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[0].id}
        className={columns[0].props.className}
      >
        {vm.name}
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[1].id}
        className={columns[1].props.className}
      >
        <FileSystemStatus
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

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[5].id}
        className={columns[5].props.className}
      >
        {!vm.persistentVolumeClaims.loaded ? (
          <Skeleton screenreaderText={t("Loading actions")} />
        ) : (
          <KebabMenu
            isDisabled={["deleting", "creating"].includes(vm.status)}
            items={kebabMenuActions}
          />
        )}
      </TableData>
    </>
  );
};
FileSystemsTabTableRow.displayName = "FileSystemsTabTableRow";
