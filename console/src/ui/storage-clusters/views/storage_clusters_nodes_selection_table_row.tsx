import { css, cx } from "@emotion/css";
import {
  type RowProps,
  type TableColumn,
  TableData,
} from "@openshift-console/dynamic-plugin-sdk";
import { Checkbox, Icon, Tooltip } from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons";
import type { IoK8sApiCoreV1Node } from "@/shared/types/openshift/4.19/types";
import { useLocalizationService } from "@/ui/services/use_localization_service";
import { useStorageClusterNodesSelectionTableRowViewModel } from "../view-models/use_storage_clusters_nodes_selection_table_row_view_model";

export const styles = {
  tabularNums: css`
    font-variant-numeric: tabular-nums;
  `,
} as const;

type TableRowProps = RowProps<
  IoK8sApiCoreV1Node,
  TableColumn<IoK8sApiCoreV1Node>[]
>;

export const StorageClustersNodesSelectionTableRow: React.FC<TableRowProps> = (
  props,
) => {
  const { activeColumnIDs, obj: node, rowData: columns } = props;
  const nodeViewModel = useStorageClusterNodesSelectionTableRowViewModel(node);
  const { t } = useLocalizationService();

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
StorageClustersNodesSelectionTableRow.displayName =
  "StorageClustersNodesSelectionTableRow";
