import { useEffect } from "react";
import {
  VirtualizedTable,
  type TableColumn,
} from "@openshift-console/dynamic-plugin-sdk";
import { Alert, Stack, StackItem } from "@patternfly/react-core";
import {
  useFusionAccessTranslations,
  t,
} from "@/hooks/useFusionAccessTranslations";
import type { IoK8sApiCoreV1Node } from "@/models/kubernetes/1.30/types";
import { useWatchNode } from "@/hooks/useWatchNode";
import {
  MIN_AMOUNT_OF_NODES_MSG_DIGEST,
  MINIMUM_AMOUNT_OF_MEMORY_GIB_LITERAL,
  MINIMUM_AMOUNT_OF_NODES,
  MINIMUM_AMOUNT_OF_NODES_LITERAL,
  WORKER_NODE_ROLE_LABEL,
} from "@/constants";
import { useTriggerAlertsOnErrors } from "@/hooks/useTriggerAlertsOnErrors";
import { useWatchLocalVolumeDiscoveryResult } from "@/hooks/useWatchLocalVolumeDiscoveryResult";
import {
  NodesSelectionTableRow,
  type ExtraRowData,
} from "./NodesSelectionTableRow";
import { NodesSelectionEmptyState } from "./NodesSelectionEmptyState";
import { useStoreContext } from "@/contexts/store/context";
import type { State, Actions } from "@/contexts/store/types";
import { getSelectedNodes } from "@/utils/kubernetes/1.30/IoK8sApiCoreV1Node";

const columns: TableColumn<IoK8sApiCoreV1Node>[] = [
  {
    id: "checkbox",
    title: "",
    props: { className: "pf-v5-c-table__check" },
  },
  {
    id: "name",
    title: t("Name"),
  },
  {
    id: "role",
    title: t("Role"),
    props: { className: "pf-v5-u-text-align-center" },
  },
  {
    id: "cpu",
    title: t("CPU"),
    props: { className: "pf-v5-u-text-align-center" },
  },
  {
    id: "memory",
    title: t("Memory"),
    props: { className: "pf-v5-u-text-align-center" },
  },
  {
    id: "shared-disks",
    title: t("Shared disks"),
    props: { className: "pf-v5-u-text-align-center" },
  },
];

export const NodesSelectionTable: React.FC = () => {
  const { t } = useFusionAccessTranslations();
  const [nodes, nodesLoaded, nodesLoadedError] = useWatchNode({
    withLabels: [WORKER_NODE_ROLE_LABEL],
    isList: true,
  });
  const [
    disksDiscoveryResults,
    disksDiscoveryResultsLoaded,
    disksDiscoveryResultsError,
  ] = useWatchLocalVolumeDiscoveryResult({ isList: true });

  useTriggerAlertsOnErrors(nodesLoadedError, disksDiscoveryResultsError);

  const isLoaded = nodesLoaded && disksDiscoveryResultsLoaded;
  const selectedNodes = getSelectedNodes(nodes);
  useValidateStorageClusterMinimumRequirements(selectedNodes, isLoaded);

  return (
    <Stack hasGutter>
      <StackItem>
        <Alert
          isInline
          variant="info"
          title={
            <>
              {t(
                "Make sure all nodes for the storage cluster are selected before you continue (at least three nodes are required)."
              )}
              <br />
              {t(
                "Worker nodes will be rebooted while creating the storage cluster."
              )}
            </>
          }
        />
      </StackItem>
      <StackItem isFilled>
        <VirtualizedTable<IoK8sApiCoreV1Node, ExtraRowData>
          data={nodes}
          unfilteredData={nodes}
          columns={columns}
          loaded={isLoaded}
          loadError={nodesLoadedError || disksDiscoveryResultsError}
          Row={NodesSelectionTableRow}
          rowData={{
            selectedNodes,
            disksDiscoveryResults,
          }}
          EmptyMsg={NodesSelectionEmptyState}
        />
      </StackItem>
    </Stack>
  );
};
NodesSelectionTable.displayName = "NodesSelectionTable";

const useValidateStorageClusterMinimumRequirements = (
  selectedNodes: IoK8sApiCoreV1Node[],
  isLoaded: boolean
) => {
  const [, dispatch] = useStoreContext<State, Actions>();
  const { t } = useFusionAccessTranslations();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (selectedNodes.length < MINIMUM_AMOUNT_OF_NODES) {
      dispatch({
        type: "updateCtas",
        payload: { createStorageCluster: { isDisabled: true } },
      });
      dispatch({
        type: "addAlert",
        payload: {
          key: MIN_AMOUNT_OF_NODES_MSG_DIGEST,
          variant: "warning",
          title: t("Storage cluster requirements"),
          description: [
            t("Each node must have the same number of shared disks"),
            t(
              "Each node must have at least {{MINIMUM_AMOUNT_OF_MEMORY_GIB_LITERAL}} of RAM",
              {
                MINIMUM_AMOUNT_OF_MEMORY_GIB_LITERAL,
              }
            ),
            t(
              "At least {{MINIMUM_AMOUNT_OF_NODES_LITERAL}} nodes must be selected.",
              {
                MINIMUM_AMOUNT_OF_NODES_LITERAL,
              }
            ),
          ],
          isDismissable: false,
        },
      });
    } else {
      dispatch({
        type: "updateCtas",
        payload: { createStorageCluster: { isDisabled: false } },
      });
      dispatch({
        type: "removeAlert",
        payload: { key: MIN_AMOUNT_OF_NODES_MSG_DIGEST },
      });
    }
  }, [dispatch, isLoaded, selectedNodes.length, t]);
};
