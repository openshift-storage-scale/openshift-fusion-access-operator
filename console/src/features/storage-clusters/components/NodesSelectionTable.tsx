import {
  TableData,
  VirtualizedTable,
  type RowProps,
  type TableColumn,
} from "@openshift-console/dynamic-plugin-sdk";
import {
  Alert,
  Checkbox,
  HelperText,
  HelperTextItem,
  Icon,
  Stack,
  StackItem,
  Tooltip,
} from "@patternfly/react-core";
import InfoIcon from "@patternfly/react-icons/dist/esm/icons/info-icon";
import { WORKER_NODE_ROLE_LABEL } from "@/constants";
import {
  t,
  useFusionAccessTranslations,
} from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import {
  useNodeSelectionChangeHandler,
  type NodeSelectionChangeHandler,
} from "../hooks/useNodeSelectionChangeHandler";
import {
  useNodesSelectionTableViewModel,
  type NodesSelectionTableRowViewModel,
} from "../hooks/useNodesSelectionTableViewModel";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";
import { useValidateMinimumRequirements } from "../hooks/useValidateMinimumRequirements";

export const NodesSelectionTable: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const lvdrsWatchState = useWatchLocalVolumeDiscoveryResult({ isList: true });
  const nodesWatchState = useWatchNode({
    withLabels: [WORKER_NODE_ROLE_LABEL],
    isList: true,
  });
  const vm = useNodesSelectionTableViewModel(nodesWatchState, lvdrsWatchState);
  const handleNodeSelectionChange = useNodeSelectionChangeHandler(
    vm,
    nodesWatchState[0]
  );
  useValidateMinimumRequirements(vm);

  return (
    <Stack hasGutter>
      <StackItem>
        <Alert
          isInline
          variant="info"
          title={t(
            "Make sure all nodes for the storage cluster are selected before you continue."
          )}
        />
      </StackItem>
      <StackItem isFilled>
        <VirtualizedTable<
          NodesSelectionTableRowViewModel,
          { onNodeSelectionChange: NodeSelectionChangeHandler }
        >
          columns={columns}
          data={vm.tableRows}
          unfilteredData={vm.tableRows}
          loaded={vm.isLoaded}
          loadError={vm.loadError}
          rowData={{ onNodeSelectionChange: handleNodeSelectionChange }}
          Row={NodesSelectionTableRow}
          EmptyMsg={NodesSelectionEmptyState}
        />
      </StackItem>
      <StackItem>
        <HelperText>
          <HelperTextItem variant="indeterminate" icon={<InfoIcon />}>
            {vm.sharedDisksCounterMessage}
          </HelperTextItem>
        </HelperText>
      </StackItem>
    </Stack>
  );
};
NodesSelectionTable.displayName = "NodesSelectionTable";

type TableRowProps = RowProps<
  NodesSelectionTableRowViewModel,
  { onNodeSelectionChange: NodeSelectionChangeHandler }
>;

const NodesSelectionTableRow: React.FC<TableRowProps> = (props) => {
  const { activeColumnIDs, obj, rowData } = props;
  const { onNodeSelectionChange } = rowData;
  const { t } = useFusionAccessTranslations();

  return (
    <>
      <TableData
        id="checkbox"
        activeColumnIDs={activeColumnIDs}
        className="pf-v6-c-table__check"
      >
        <Checkbox
          id={`node-${obj.uid}`}
          isChecked={obj.status === "selected"}
          isDisabled={
            obj.status === "selection-pending" ||
            obj.warnings.has("InsufficientMemory")
          }
          onChange={onNodeSelectionChange(obj)}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        {obj.name}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v6-u-text-align-center"
        id="role"
      >
        {obj.role}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v6-u-text-align-center"
        id="cpu"
      >
        {obj.cpu}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v6-u-text-align-center"
        id="memory"
      >
        {obj.memory}{" "}
        {obj.warnings.has("InsufficientMemory") && (
          <Tooltip content={t("Insufficient")}>
            <Icon status="warning" isInline>
              <ExclamationTriangleIcon />
            </Icon>
          </Tooltip>
        )}
      </TableData>
    </>
  );
};
NodesSelectionTableRow.displayName = "NodesSelectionTableRow";

const NodesSelectionEmptyState: React.FC = () => {
  // TODO(jkilzi): Impl. NodeSeletionTableEmptyState
  return null;
};
NodesSelectionEmptyState.displayName = "NodesSelectionEmptyState";

const columns: TableColumn<NodesSelectionTableRowViewModel>[] = [
  {
    id: "checkbox",
    title: "",
    props: { className: "pf-v6-c-table__check" },
  },
  {
    id: "name",
    title: t("Name"),
  },
  {
    id: "role",
    title: t("Role"),
    props: { className: "pf-v6-u-text-align-center" },
  },
  {
    id: "cpu",
    title: t("CPU"),
    props: { className: "pf-v6-u-text-align-center" },
  },
  {
    id: "memory",
    title: t("Memory"),
    props: { className: "pf-v6-u-text-align-center" },
  },
];
