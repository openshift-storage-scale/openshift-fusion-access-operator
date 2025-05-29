import {
  type RowProps,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import { Checkbox, Icon, Tooltip } from "@patternfly/react-core";
import { useSelectNodeHandler } from "@/hooks/useSelectNodeHandler";
import { useSharedDisksCount } from "@/hooks/useSharedDisksCount";
import type { IoK8sApiCoreV1Node } from "@/models/kubernetes/1.30/types";
import type { LocalVolumeDiscoveryResult } from "@/models/fusion-access/LocalVolumeDiscoveryResult";
import { useNodeSelectionState } from "@/hooks/useNodeSelectionState";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";
import { VALUE_NOT_AVAILABLE } from "@/constants";

export interface ExtraRowData {
  selectedNodes: IoK8sApiCoreV1Node[];
  disksDiscoveryResults: LocalVolumeDiscoveryResult[];
}

export type TableRowProps = RowProps<IoK8sApiCoreV1Node, ExtraRowData>;

export const NodesSelectionTableRow: React.FC<TableRowProps> = (props) => {
  const { activeColumnIDs, obj: node, rowData } = props;
  const { selectedNodes, disksDiscoveryResults } = rowData;

  const [
    {
      uid,
      name,
      role,
      cpu,
      memory,
      hasMemoryWarning,
      isSelected,
      isSelectionPending,
    },
    nodeSelectionActions,
  ] = useNodeSelectionState(node);

  const sharedDisksCount = useSharedDisksCount(
    name,
    isSelected,
    selectedNodes,
    disksDiscoveryResults
  );

  const handleNodeSelection = useSelectNodeHandler({
    node,
    isSelectionPending,
    nodeSelectionActions,
  });

  return (
    <>
      <TableData
        activeColumnIDs={activeColumnIDs}
        id="checkbox"
        className="pf-v5-c-table__check"
      >
        <Checkbox
          id={`node-${uid}`}
          isChecked={isSelected}
          isDisabled={isSelectionPending || hasMemoryWarning}
          onChange={handleNodeSelection}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        {name}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v5-u-text-align-center"
        id="role"
      >
        {role}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v5-u-text-align-center"
        id="cpu"
      >
        {cpu}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v5-u-text-align-center"
        id="memory"
      >
        {memory}{" "}
        {hasMemoryWarning && (
          <Tooltip content={"Insufficient"}>
            <Icon status="warning" isInline>
              <ExclamationTriangleIcon />
            </Icon>
          </Tooltip>
        )}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v5-u-text-align-center"
        id="shared-disks"
      >
        {sharedDisksCount > 0 ? sharedDisksCount : VALUE_NOT_AVAILABLE}
      </TableData>
    </>
  );
};
NodesSelectionTableRow.displayName = "NodesSelectionTableRow";
