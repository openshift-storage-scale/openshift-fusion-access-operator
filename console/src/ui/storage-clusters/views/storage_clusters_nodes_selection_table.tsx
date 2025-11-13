import {
  type TableColumn,
  VirtualizedTable,
} from "@openshift-console/dynamic-plugin-sdk";
import {
  Alert,
  HelperText,
  HelperTextItem,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import type { IoK8sApiCoreV1Node } from "@/shared/types/openshift/4.19/types";
import { useLocalizationService } from "@/ui/services/use_localization_service";
import { useStorageClusterNodesSelectionTableViewModel } from "../view-models/use_storage_clusters_nodes_selection_table_view_model";
import { StorageClustersNodesSelectionEmptyState } from "./storage_clusters_nodes_selection_empty_state";
import { StorageClustersNodesSelectionTableRow } from "./storage_clusters_nodes_selection_table_row";

export const StorageClustersNodesSelectionTable: React.FC = () => {
  const { t } = useLocalizationService();
  const vm = useStorageClusterNodesSelectionTableViewModel();

  return (
    <Stack hasGutter>
      <StackItem>
        <Alert
          isInline
          variant="info"
          title={t(
            "Make sure all nodes for the storage cluster are selected before you continue (at least three nodes are required).",
          )}
        />
      </StackItem>
      <StackItem isFilled>
        <VirtualizedTable<IoK8sApiCoreV1Node, TableColumn<IoK8sApiCoreV1Node>[]>
          columns={vm.columns}
          data={vm.workerNodes}
          unfilteredData={vm.workerNodes}
          loaded={vm.loaded}
          loadError={vm.error}
          EmptyMsg={StorageClustersNodesSelectionEmptyState}
          Row={StorageClustersNodesSelectionTableRow}
          rowData={vm.columns}
        />
      </StackItem>
      <StackItem>
        <HelperText>
          <HelperTextItem>{vm.sharedDisksCountMessage}</HelperTextItem>
        </HelperText>
      </StackItem>
    </Stack>
  );
};
StorageClustersNodesSelectionTable.displayName =
  "StorageClustersNodesSelectionTable";
