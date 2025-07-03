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
import { InfoIcon } from "@patternfly/react-icons";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { IoK8sApiCoreV1Node } from "@/shared/types/kubernetes/1.30/types";
import { useNodesSelectionTableViewModel } from "../hooks/useNodesSelectionTableViewModel";
import { NodesSelectionEmptyState } from "./NodesSelectionEmptyState";
import { NodesSelectionTableRow } from "./NodesSelectionTableRow";

export const NodesSelectionTable: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const vm = useNodesSelectionTableViewModel();

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
        <VirtualizedTable<IoK8sApiCoreV1Node, TableColumn<IoK8sApiCoreV1Node>[]>
          columns={vm.columns}
          data={vm.nodes.data ?? []}
          unfilteredData={vm.nodes.data ?? []}
          loaded={vm.loaded}
          loadError={vm.error}
          EmptyMsg={NodesSelectionEmptyState}
          Row={NodesSelectionTableRow}
          rowData={vm.columns}
        />
      </StackItem>
      <StackItem>
        <HelperText>
          <HelperTextItem variant="indeterminate" icon={<InfoIcon />}>
            {vm.sharedDisksCountMessage}
          </HelperTextItem>
        </HelperText>
      </StackItem>
    </Stack>
  );
};
NodesSelectionTable.displayName = "NodesSelectionTable";
