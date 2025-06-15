import { VALUE_NOT_AVAILABLE } from "@/constants";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { getName } from "@/shared/utils/console/K8sResourceCommon";
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
import { getFilesystemStatus, isFilesystemInUse } from "../utils/filesystem";
import { FileSystemsDashboardLink } from "./FileSystemsDashboardLink";
import FileSystemStatus from "./FileSystemsStatus";
import FileSystemStorageClasses from "./FileSystemsStorageClasses";
import { useState } from "react";
import type { FileSystemsTabViewModel } from "../hooks/useFileSystemsTabViewModel";

type FileSystemsTabTableRowProps = RowProps<
  FileSystem,
  FileSystemsTabViewModel
>;

export const FileSystemsTabTableRow: React.FC<FileSystemsTabTableRowProps> = (
  props
) => {
  const { activeColumnIDs, obj: fileSystem, rowData: vm } = props;

  const { t } = useFusionAccessTranslations();

  const [isOpenActionsMenu, setIsOpenActionsMenu] = useState(false);

  const name = getName(fileSystem);
  const status = getFilesystemStatus(fileSystem, t);

  // Currently we support creating only a single file system pool
  const rawCapacity =
    fileSystem.status?.pools?.[0].totalDiskSize ?? VALUE_NOT_AVAILABLE;

  const isInUse = isFilesystemInUse(
    fileSystem,
    vm.storageClasses.state.data ?? [],
    vm.persistenVolumeClaims.state.data ?? []
  );

  return (
    <>
      <TableData
        activeColumnIDs={activeColumnIDs}
        id={vm.columns[0].id}
        className={vm.columns[0].props.className}
      >
        {name}
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={vm.columns[1].id}
        className={vm.columns[1].props.className}
      >
        <FileSystemStatus status={status} />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={vm.columns[2].id}
        className={vm.columns[2].props.className}
      >
        {rawCapacity}
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={vm.columns[3].id}
        className={vm.columns[3].props.className}
      >
        <FileSystemStorageClasses
          isDisabled={status.id === "deleting"}
          fileSystem={fileSystem}
          loaded={vm.storageClasses.state.loaded}
          storageClasses={vm.storageClasses.state.data ?? []}
        />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={vm.columns[4].id}
        className={vm.columns[4].props.className}
      >
        <FileSystemsDashboardLink
          isDisabled={status.id === "deleting"}
          fileSystem={fileSystem}
          routes={vm.routes.state.data ?? []}
          loaded={vm.routes.state.loaded}
        />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={vm.columns[5].id}
        className={vm.columns[5].props.className}
      >
        {!vm.persistenVolumeClaims.state.loaded ? (
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
                  status.id === "deleting" || status.id === "creating" || isInUse
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
                  vm.deleteModal.actions.setFileSystem(fileSystem);
                  vm.deleteModal.actions.setIsOpen(true);
                }}
                isDisabled={status.id === "deleting" || isInUse}
                description={
                  isInUse ? <div>{t("Filesystem is in use")}</div> : null
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
