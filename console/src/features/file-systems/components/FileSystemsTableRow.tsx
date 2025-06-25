import { useState } from "react";
import {
  type RowProps,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import {
  Skeleton,
  Dropdown,
  MenuToggle,
  DropdownList,
  DropdownItem,
} from "@patternfly/react-core";
import { EllipsisVIcon } from "@patternfly/react-icons";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import type { FileSystemsTableViewModel } from "../hooks/useFileSystemsTableViewModel";
import { FileSystemsDashboardLink } from "./FileSystemsDashboardLink";
import { FileSystemStorageClasses } from "./FileSystemsStorageClasses";
import { FileSystemStatus } from "./FileSystemsStatus";
import { useFileSystemTableRowViewModel } from "../hooks/useFileSystemTableRowViewModel";

type FileSystemsTabTableRowProps = RowProps<
  FileSystem,
  Pick<FileSystemsTableViewModel, "columns" | "deleteModal" | "routes">
>;

export const FileSystemsTabTableRow: React.FC<FileSystemsTabTableRowProps> = (
  props
) => {
  const { activeColumnIDs, obj: fileSystem, rowData } = props;

  const { columns, deleteModal, routes } = rowData;

  const vm = useFileSystemTableRowViewModel(fileSystem);

  const [isOpenActionsMenu, setIsOpenActionsMenu] = useState(false);

  const { t } = useFusionAccessTranslations();

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
          icon={vm.Icon}
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
          <Dropdown
            isOpen={isOpenActionsMenu}
            onOpenChange={setIsOpenActionsMenu}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                aria-label="filesystem actions"
                variant="plain"
                isDisabled={
                  vm.status === "deleting" ||
                  vm.status === "creating" ||
                  vm.isInUse
                }
                onClick={() => setIsOpenActionsMenu(!isOpenActionsMenu)}
                isExpanded={isOpenActionsMenu}
              >
                <EllipsisVIcon />
              </MenuToggle>
            )}
            shouldFocusToggleOnSelect
            popperProps={{ position: "right" }}
            style={{ whiteSpace: "nowrap" }}
          >
            <DropdownList>
              <DropdownItem
                onClick={() => {
                  setIsOpenActionsMenu(false);
                  deleteModal.setFileSystem(fileSystem);
                  deleteModal.setIsOpen(true);
                }}
                isDisabled={vm.status === "deleting" || vm.isInUse}
                description={
                  vm.isInUse ? <div>{t("Filesystem is in use")}</div> : null
                }
              >
                {t("Delete")}
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        )}
      </TableData>
    </>
  );
};
FileSystemsTabTableRow.displayName = "FileSystemsTabTableRow";
