import {
  type RowProps,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import { Checkbox, Icon, Tooltip } from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";
import type { NodeSelectionChangeHandler } from "@/hooks/useNodeSelectionChangeHandler";
import type { NodesSelectionTableRowViewModel } from "@/view-models/NodesSelectionTableRowViewModel";
import { useSignals } from "@preact/signals-react/runtime";

type TableRowProps = RowProps<
  NodesSelectionTableRowViewModel,
  { onNodeSelectionChange: NodeSelectionChangeHandler }
>;

export const NodesSelectionTableRow: React.FC<TableRowProps> = (props) => {
  useSignals();
  const { activeColumnIDs, obj: node, rowData } = props;
  const { onNodeSelectionChange } = rowData;

  return (
    <>
      <TableData
        activeColumnIDs={activeColumnIDs}
        id="checkbox"
        className="pf-v6-c-table__check"
      >
        <Checkbox
          id={`node-${node.uid}`}
          isChecked={node.status === "selected"}
          isDisabled={
            node.status === "selection-pending" ||
            node.warnings.has("InsufficientMemory")
          }
          onChange={onNodeSelectionChange(node)}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id="name">
        {node.name}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v5-u-text-align-center"
        id="role"
      >
        {node.role}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v5-u-text-align-center"
        id="cpu"
      >
        {node.cpu}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className="pf-v5-u-text-align-center"
        id="memory"
      >
        {node.getMemoryAsString()}{" "}
        {node.warnings.has("InsufficientMemory") && (
          <Tooltip content={"Insufficient"}>
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
