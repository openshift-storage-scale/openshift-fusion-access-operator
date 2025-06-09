import { useCallback, useContext, useMemo, useState } from "react";
import { useHistory } from "react-router";
import {
  TableData,
  useK8sWatchResource,
  VirtualizedTable,
  type RowProps,
  type StorageClass,
  type TableColumn,
} from "@openshift-console/dynamic-plugin-sdk";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  MenuToggle,
  Skeleton,
} from "@patternfly/react-core";
import {
  EllipsisVIcon,
  ExternalLinkAltIcon,
  FolderIcon,
} from "@patternfly/react-icons";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchFileSystem } from "@/shared/hooks/useWatchFileSystems";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { getName } from "@/shared/utils/console/K8sResourceCommon";
import { FileSystemsCreateButton } from "./FileSystemsCreateButton";
import { VALUE_NOT_AVAILABLE } from "@/constants";
import { ConnectedFileSystemsDeleteModal } from "./FileSystemsDeleteModal";
import { getFilesystemStatus } from "@/shared/utils/status/filesystem";
import { FileSystemTableContext } from "@/features/file-systems/contexts/FileSystemsTableContext";
import type { IoK8sApiCoreV1PersistentVolumeClaim } from "@/shared/types/kubernetes/1.30/types";
import { GpfsDashboardLink, type Route } from "./FileSystemsGpfsDashboardLink";
import { isFilesystemUsed } from "@/shared/utils/filesystem";
import FileSystemStatus from "./FileSystemsStatus";
import FileSystemStorageClasses from "./FileSystemsStorageClasses";
import { useWatchSpectrumScaleCluster } from "@/shared/hooks/useWatchSpectrumScaleCluster";

const columns = [
  {
    id: "name",
    props: { className: "pf-v5-u-w-25" },
  },
  {
    id: "status",
    props: { className: "pf-v5-u-w-10" },
  },
  {
    id: "raw-capacity",
    props: { className: "pf-v5-u-w-10" },
  },
  {
    id: "storage-class",
    props: { className: "pf-v5-u-w-10" },
  },
  {
    id: "gpfs-dashboard-link",
    props: {},
  },
  {
    id: "",
    props: { className: "dropdown-kebab-pf pf-v5-c-table__action" },
  },
];

const useTableResources = () => {
  const [fileSystems, fileSystemsLoaded, fileSystemsLoadedError] =
    useWatchFileSystem({ isList: true });

  const [pvcs, pvcsLoaded] = useK8sWatchResource<
    IoK8sApiCoreV1PersistentVolumeClaim[]
  >({
    isList: true,
    namespaced: true,
    groupVersionKind: {
      version: "v1",
      kind: "PersistentVolumeClaim",
    },
  });

  const [storageClasses, scLoaded] = useK8sWatchResource<StorageClass[]>({
    isList: true,
    namespaced: true,
    groupVersionKind: {
      group: "storage.k8s.io",
      version: "v1",
      kind: "StorageClass",
    },
  });

  const [storageClusters, storageClustersLoaded] = useWatchSpectrumScaleCluster(
    { isList: true, limit: 1 }
  );

  const storageClusterName = storageClusters?.[0]?.metadata?.name;

  const [routes, routesLoaded] = useK8sWatchResource<Route[]>(
    storageClusterName
      ? {
          groupVersionKind: {
            group: "route.openshift.io",
            version: "v1",
            kind: "Route",
          },
          isList: true,
          selector: {
            matchLabels: {
              "app.kubernetes.io/instance": storageClusterName,
              "app.kubernetes.io/name": "gui",
            },
          },
        }
      : null
  );

  return {
    fileSystems,
    fileSystemsLoaded,
    fileSystemsLoadedError,
    pvcs,
    pvcsLoaded,
    storageClasses,
    scLoaded,
    routes,
    routesLoaded: routesLoaded && storageClustersLoaded,
  };
};

type RowData = {
  storageClasses: StorageClass[];
  scLoaded: boolean;
  pvcs: IoK8sApiCoreV1PersistentVolumeClaim[];
  pvcsLoaded: boolean;
  routes: Route[];
  routesLoaded: boolean;
};

export const FileSystemsTab: React.FC = () => {
  const {
    fileSystems,
    fileSystemsLoaded,
    fileSystemsLoadedError,
    pvcs,
    pvcsLoaded,
    storageClasses,
    scLoaded,
    routes,
    routesLoaded,
  } = useTableResources();

  const columns = useFileSystemsTableColumns();
  const [deleteFs, setDeleteFs] = useState<FileSystem>();

  return (
    <FileSystemTableContext.Provider
      value={{ filesystem: deleteFs, setFileSystem: setDeleteFs }}
    >
      <VirtualizedTable<FileSystem, RowData>
        data={fileSystems}
        unfilteredData={fileSystems}
        loaded={fileSystemsLoaded}
        loadError={fileSystemsLoadedError}
        columns={columns}
        Row={FileSystemsTabTableRow}
        EmptyMsg={FileSystemsTableEmptyState}
        rowData={{
          storageClasses,
          scLoaded,
          pvcs,
          pvcsLoaded,
          routes,
          routesLoaded,
        }}
      />
      <ConnectedFileSystemsDeleteModal />
    </FileSystemTableContext.Provider>
  );
};
FileSystemsTab.displayName = "FileSystemsTab";

type FileSystemsTabTableRowProps = RowProps<FileSystem, RowData>;
const FileSystemsTabTableRow: React.FC<FileSystemsTabTableRowProps> = (
  props
) => {
  const {
    activeColumnIDs,
    obj: fileSystem,
    rowData: {
      storageClasses,
      pvcs,
      pvcsLoaded,
      scLoaded,
      routes,
      routesLoaded,
    },
  } = props;
  const { setFileSystem } = useContext(FileSystemTableContext);
  const { t } = useFusionAccessTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const name = getName(fileSystem);
  const status = getFilesystemStatus(fileSystem, t);
  const rawCapacity =
    fileSystem.status?.pools?.[0].totalDiskSize ?? VALUE_NOT_AVAILABLE; // TODO(jkilzi): Find out how to get the rawCapacity

  const isUsed = isFilesystemUsed(fileSystem, storageClasses, pvcs);

  return (
    <>
      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[0].id}
        {...columns[0].props}
      >
        {name}
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[1].id}
        {...columns[1].props}
      >
        <FileSystemStatus status={status} />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[2].id}
        {...columns[2].props}
      >
        {rawCapacity}
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[3].id}
        {...columns[3].props}
      >
        <FileSystemStorageClasses
          fileSystem={fileSystem}
          loaded={scLoaded}
          storageClasses={storageClasses}
        />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[4].id}
        {...columns[4].props}
      >
        <GpfsDashboardLink
          fileSystem={fileSystem}
          routes={routes}
          loaded={routesLoaded}
        />
      </TableData>

      <TableData
        activeColumnIDs={activeColumnIDs}
        id={columns[5].id}
        {...columns[5].props}
      >
        {!pvcsLoaded ? (
          <Skeleton screenreaderText={t("Loading actions")} />
        ) : (
          <Dropdown
            isOpen={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                aria-label="filesystem actions"
                variant="plain"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                isExpanded={isMenuOpen}
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
                  setFileSystem(fileSystem);
                  setIsMenuOpen(false);
                }}
                isDisabled={status.id === "deleting" || isUsed}
                description={
                  isUsed ? <div>{t("Filesystem is in use")}</div> : undefined
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

const useFileSystemsTableColumns = (): TableColumn<FileSystem>[] => {
  const { t } = useFusionAccessTranslations();
  return useMemo(
    () => [
      {
        id: columns[0].id,
        title: t("Name"),
        props: columns[0].props,
      },
      {
        id: columns[1].id,
        title: t("Status"),
        props: columns[1].props,
      },
      {
        id: columns[2].id,
        title: t("Raw capacity"),
        props: columns[2].props,
      },
      {
        id: columns[3].id,
        title: t("StorageClass"),
        props: columns[3].props,
      },
      {
        id: columns[4].id,
        title: t("Link to GPFS dashboard"),
        props: columns[4].props,
      },
      {
        id: columns[5].id,
        title: "",
        props: columns[5].props,
      },
    ],
    [t]
  );
};

const FileSystemsTableEmptyState: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const histroy = useHistory();
  const handleCreateFileSystem = useCallback(() => {
    histroy.push("/fusion-access/file-systems/create");
  }, [histroy]);

  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={t("No file systems")}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={FolderIcon} />}
      />
      <EmptyStateBody>
        {t("You can create one by pressing the button below.")}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <FileSystemsCreateButton
            onCreateFileSystem={handleCreateFileSystem}
          />
        </EmptyStateActions>
        <EmptyStateActions>
          <Button
            component="a"
            variant="link"
            target="_blank"
            rel="noopener noreferrer"
            href="#"
          >
            {t("Learn more about Fusion Access for SAN storage clusters")}{" "}
            <ExternalLinkAltIcon />
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};
FileSystemsTableEmptyState.displayName = "FileSystemsTableEmptyState";
