import {
  VirtualizedTable,
  type TableColumn,
} from "@openshift-console/dynamic-plugin-sdk";
import { Alert, Stack, StackItem } from "@patternfly/react-core";
import { WORKER_NODE_ROLE_LABEL } from "@/constants";
import {
  t,
  useFusionAccessTranslations,
} from "@/hooks/useFusionAccessTranslations";
import { type NodeSelectionChangeHandler } from "@/hooks/useNodeSelectionChangeHandler";
import { useWatchNode } from "@/hooks/useWatchNode";
import { useWatchLocalVolumeDiscoveryResult } from "@/hooks/useWatchLocalVolumeDiscoveryResult";
import {
  useNodesSelectionTableViewModel,
  type NodesSelectionTableRowViewModel,
} from "@/hooks/useNodesSelectionTableViewModel";
import { NodesSelectionTableRow } from "./NodesSelectionTableRow";
import { NodesSelectionEmptyState } from "./NodesSelectionEmptyState";
import { useEffect } from "react";

export const NodesSelectionTable: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const nodesWatchState = useWatchNode({
    withLabels: [WORKER_NODE_ROLE_LABEL],
    isList: true,
  });
  const lvdrsWatchState = useWatchLocalVolumeDiscoveryResult({ isList: true });
  const vm = useNodesSelectionTableViewModel(nodesWatchState, lvdrsWatchState);

  useEffect(() => {
    const n = vm.selectedNodes.length;
    const s = vm.sharedDisks.size;
    console.log(
      `${n === 0 ? "No" : n} nodes selected${n >= 2 ? `, ${s} shared disks` : ""}`
    );
  }, [vm.selectedNodes.length, vm.sharedDisks.size]);

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
          rowData={{ onNodeSelectionChange: vm.handleNodeSelectionChange }}
          Row={NodesSelectionTableRow}
          EmptyMsg={NodesSelectionEmptyState}
        />
      </StackItem>
    </Stack>
  );
};
NodesSelectionTable.displayName = "NodesSelectionTable";

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
