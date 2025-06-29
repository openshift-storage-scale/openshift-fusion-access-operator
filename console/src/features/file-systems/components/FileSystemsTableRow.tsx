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

type FileSystemsTabTableRowProps = RowProps<
  FileSystem,
  Pick<FileSystemsTableViewModel, "columns" | "handleDelete" | "routes">
>;

export const FileSystemsTabTableRow: React.FC<FileSystemsTabTableRowProps> = (
  props
) => {
  const { activeColumnIDs, obj: fileSystem, rowData } = props;

  const { columns, handleDelete, routes } = rowData;

  const vm = useFileSystemTableRowViewModel(fileSystem);

  const isActionsMenuDisabled = useMemo(
    () => vm.status === "deleting" || vm.status === "creating" || vm.isInUse,
    [vm.isInUse, vm.status]
  );

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
          isDisabled={vm.status === "deleting"}
          fileSystem={fileSystem}
          loaded={vm.storageClasses.loaded}
          storageClasses={vm.storageClasses.data ?? []}
        />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[4].id}
        className={columns[4].props.className}
      >
        <FileSystemsDashboardLink
          isDisabled={vm.status === "deleting"}
          fileSystem={fileSystem}
          routes={routes.data ?? []}
          loaded={routes.loaded}
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
            isDisabled={isActionsMenuDisabled}
            items={kebabMenuActions}
          />
        )}
      </TableData>
    </>
  );
};
FileSystemsTabTableRow.displayName = "FileSystemsTabTableRow";
