import { usePluginTranslations } from "@/hooks/usePluginTranslations";
import type { IoK8sApiCoreV1Node } from "@/models/kubernetes/1.30/types";
import type { TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import React from "react";

export type UseNodesSelectionTableColumns =
  () => TableColumn<IoK8sApiCoreV1Node>[];
export const useNodesSelectionTableColumns: UseNodesSelectionTableColumns =
  () => {
    const { t } = usePluginTranslations();
    return React.useMemo(
      () => [
        {
          id: "checkbox",
          props: { className: "pf-v5-c-table__check" },
          title: "",
        },
        {
          id: "name",
          title: t("Name"),
        },
        {
          id: "role",
          title: t("Role"),
        },
        {
          id: "cpu",
          title: t("CPU"),
        },
        {
          id: "memory",
          title: t("Memory"),
        },
        {
          id: "disks",
          title: t("Disks"),
        },
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );
  };
