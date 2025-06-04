import {
  VirtualizedTable,
  type TableColumn,
} from "@openshift-console/dynamic-plugin-sdk";
import { Alert, Stack, StackItem } from "@patternfly/react-core";
import {
  t,
  useFusionAccessTranslations,
} from "@/hooks/useFusionAccessTranslations";
import { WORKER_NODE_ROLE_LABEL } from "@/constants";
import { NodesSelectionTableRow } from "./NodesSelectionTableRow";
import { NodesSelectionEmptyState } from "./NodesSelectionEmptyState";
import { useWatchNode } from "@/hooks/useWatchNode";
import { useWatchLocalVolumeDiscoveryResult } from "@/hooks/useWatchLocalVolumeDiscoveryResult";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect } from "react";
import {
  useNodeSelectionChangeHandler,
  type NodeSelectionChangeHandler,
} from "@/hooks/useNodeSelectionChangeHandler";
import { useNodesSelectionTableViewModel } from "@/view-models/NodesSelectionTableViewModel";
import type { NodesSelectionTableRowViewModel } from "@/view-models/NodesSelectionTableRowViewModel";

export const NodesSelectionTable: React.FC = () => {
  useSignals();
  const state = useNodesSelectionTableViewModel();
  const { t } = useFusionAccessTranslations();
  const [nodes, nodesLoaded, nodesLoadErrorMessage] = useWatchNode({
    withLabels: [WORKER_NODE_ROLE_LABEL],
    isList: true,
  });
  const [lvdrs, lvdrsLoaded, lvdrsLoadErrorMessage] =
    useWatchLocalVolumeDiscoveryResult({ isList: true });

  useEffect(() => {
    state.isLoaded = nodesLoaded && lvdrsLoaded;
    state.loadErrorMessage = nodesLoadErrorMessage || lvdrsLoadErrorMessage;
    if (state.isLoaded && !state.loadErrorMessage) {
      state.setTableRows(nodes);
    }
  }, [
    state,
    lvdrsLoadErrorMessage,
    lvdrsLoaded,
    nodes,
    nodesLoadErrorMessage,
    nodesLoaded,
  ]);

  const handleNodeSelectionChange = useNodeSelectionChangeHandler(nodes);

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
          data={state.tableRows}
          unfilteredData={state.tableRows}
          loaded={state.isLoaded}
          loadError={state.loadErrorMessage}
          rowData={{ onNodeSelectionChange: handleNodeSelectionChange }}
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
