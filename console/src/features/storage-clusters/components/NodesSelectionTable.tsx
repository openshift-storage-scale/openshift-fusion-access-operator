import {
  VirtualizedTable,
  type TableColumn,
} from "@openshift-console/dynamic-plugin-sdk";
import {
  Alert,
  HelperText,
  HelperTextItem,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import InfoIcon from "@patternfly/react-icons/dist/esm/icons/info-icon";
import {
  MIN_AMOUNT_OF_NODES_MSG_DIGEST,
  MINIMUM_AMOUNT_OF_NODES,
  MINIMUM_AMOUNT_OF_NODES_LITERAL,
  MINIMUM_AMOUNT_OF_SHARED_DISKS,
  MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL,
  WORKER_NODE_ROLE_LABEL,
} from "@/constants";
import {
  t,
  useFusionAccessTranslations,
} from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import { NodesSelectionEmptyState } from "./NodesSelectionEmptyState";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useEffect } from "react";
import {
  useNodeSelectionChangeHandler,
  type NodeSelectionChangeHandler,
} from "../hooks/useNodeSelectionChangeHandler";
import {
  useNodesSelectionTableViewModel,
  type NodesSelectionTableRowViewModel,
  type NodesSelectionTableViewModel,
} from "../hooks/useNodesSelectionTableViewModel";
import { NodesSelectionTableRow } from "./NodesSelectionTableRow";

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
  useValidateStorageClusterMinimumRequirements(vm);

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

const useValidateStorageClusterMinimumRequirements = (
  vm: NodesSelectionTableViewModel
) => {
  const [, dispatch] = useStore<State, Actions>();
  const { t } = useFusionAccessTranslations();

  useEffect(() => {
    if (!vm.isLoaded) {
      return;
    }

    const conditions: boolean[] = [
      vm.sharedDisks.size < MINIMUM_AMOUNT_OF_SHARED_DISKS &&
        vm.selectedNodes.length < 2,
      vm.selectedNodes.length < MINIMUM_AMOUNT_OF_NODES,
    ];

    if (conditions.some(Boolean)) {
      dispatch({
        type: "updateCtas",
        payload: { createStorageCluster: { isDisabled: true } },
      });
      dispatch({
        type: "showAlert",
        payload: {
          key: MIN_AMOUNT_OF_NODES_MSG_DIGEST,
          variant: "warning",
          title: t("Storage cluster requirements"),
          description: [
            conditions[0]
              ? t(
                  "Selected nodes must share at least {{MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL}} disk",
                  { MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL }
                )
              : "",
            conditions[1]
              ? t(
                  "At least {{MINIMUM_AMOUNT_OF_NODES_LITERAL}} nodes must be selected.",
                  {
                    MINIMUM_AMOUNT_OF_NODES_LITERAL,
                  }
                )
              : "",
          ].filter(Boolean),
          isDismissable: false,
        },
      });
    } else {
      dispatch({
        type: "updateCtas",
        payload: { createStorageCluster: { isDisabled: false } },
      });
      dispatch({
        type: "dismissAlert",
      });
    }
  }, [dispatch, t, vm.isLoaded, vm.selectedNodes.length, vm.sharedDisks.size]);
};
