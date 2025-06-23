import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { IoK8sApiCoreV1Node } from "@/shared/types/kubernetes/1.30/types";
import {
  type RowProps,
  type TableColumn,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import { Checkbox, Tooltip, Icon } from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";
import { useNodesSelectionTableRowViewModel } from "../hooks/useNodesSelectionTableRowViewModel";
import { css, cx } from "@emotion/css";

const styles = {
  tabularNums: css`
    font-variant-numeric: tabular-nums;
  `,
} as const;

type TableRowProps = RowProps<
  IoK8sApiCoreV1Node,
  TableColumn<IoK8sApiCoreV1Node>[]
>;

export const NodesSelectionTableRow: React.FC<TableRowProps> = (props) => {
  const { activeColumnIDs, obj: node, rowData: columns } = props;

  const nodeViewModel = useNodesSelectionTableRowViewModel(node);

  const { t } = useFusionAccessTranslations();

  return (
    <>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={columns[0].props?.className}
        id={columns[0].id}
      >
        <Checkbox
          id={`node-${nodeViewModel.uid}`}
          isChecked={nodeViewModel.status === "selected"}
          isDisabled={
            nodeViewModel.status === "selection-pending" ||
            nodeViewModel.warnings.has("InsufficientMemory")
          }
          onChange={nodeViewModel.handleNodeSelectionChange}
        />
      </TableData>
      <TableData activeColumnIDs={activeColumnIDs} id={columns[1].id}>
        {nodeViewModel.name}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={columns[2].props?.className}
        id={columns[2].id}
      >
        {nodeViewModel.role}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={cx(columns[3].props?.className, styles.tabularNums)}
        id={columns[3].id}
      >
        {nodeViewModel.cpu}
      </TableData>
      <TableData
        activeColumnIDs={activeColumnIDs}
        className={cx(columns[4].props?.className, styles.tabularNums)}
        id={columns[4].id}
      >
        {nodeViewModel.memory}{" "}
        {nodeViewModel.warnings.has("InsufficientMemory") && (
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
