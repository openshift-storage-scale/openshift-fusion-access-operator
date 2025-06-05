import {
  type RowProps,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import { Checkbox, Icon, Tooltip } from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";
import type { NodeSelectionChangeHandler } from "@/hooks/useNodeSelectionChangeHandler";
import type { NodesSelectionTableRowViewModel } from "@/hooks/useNodesSelectionTableViewModel";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";

type TableRowProps = RowProps<
  NodesSelectionTableRowViewModel,
  { onNodeSelectionChange: NodeSelectionChangeHandler }
>;

export const NodesSelectionTableRow: React.FC<TableRowProps> = (props) => {
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
