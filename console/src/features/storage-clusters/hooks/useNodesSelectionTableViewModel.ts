import { useMemo } from "react";
import type { IoK8sApiCoreV1Node } from "@/shared/types/kubernetes/1.30/types";
import { STORAGE_ROLE_LABEL, WORKER_NODE_ROLE_LABEL } from "@/constants";
import { hasLabel } from "@/shared/utils/console/K8sResourceCommon";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import type { TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import { useValidateMinimumRequirements } from "./useValidateMinimumRequirements";
import type { NormalizedWatchK8sResult } from "@/shared/utils/console/UseK8sWatchResource";

export interface NodesSelectionTableViewModel {
  columns: TableColumn<IoK8sApiCoreV1Node>[];
  loaded: boolean;
  error: Error | null;
  nodes: NormalizedWatchK8sResult<IoK8sApiCoreV1Node[]>;
  selectedNodes: IoK8sApiCoreV1Node[];
  sharedDisksCount: number;
  sharedDisksCountMessage: string;
}

export const useNodesSelectionTableViewModel =
  (): NodesSelectionTableViewModel => {
    const { t } = useFusionAccessTranslations();

    const lvdrs = useWatchLocalVolumeDiscoveryResult();

    const nodes = useWatchNode({
      withLabels: [WORKER_NODE_ROLE_LABEL],
    });

    const loaded = useMemo(
      () => nodes.loaded && lvdrs.loaded,
      [lvdrs.loaded, nodes.loaded]
    );

    const error = useMemo(
      () => nodes.error || lvdrs.error,
      [lvdrs.error, nodes.error]
    );

    const selectedNodes = useMemo(
      () => (nodes.data ?? []).filter((n) => hasLabel(n, STORAGE_ROLE_LABEL)),
      [nodes]
    );

    const sharedDisksCount = useMemo(() => {
      const wwnSetsList = (lvdrs.data ?? [])
        .filter((lvdr) =>
          selectedNodes.find((n) => n.metadata?.name === lvdr.spec.nodeName)
        )
        .map((lvdr) => lvdr?.status?.discoveredDevices ?? [])
        .map((dd) => new Set(dd.map((d) => d.WWN)));

      return wwnSetsList.length >= 2
        ? wwnSetsList.reduce((previous, current) =>
            previous.intersection(current)
          ).size
        : new Set<string>().size;
    }, [lvdrs, selectedNodes]);

    const sharedDisksCountMessage = useMemo(() => {
      const n = selectedNodes.length;
      const s = sharedDisksCount;
      switch (true) {
        case n === 0:
          return t("No nodes selected");
        case n === 1:
          return t("{{n}} node selected", { n });
        case n >= 2 && s === 1:
          return t("{{n}} nodes selected with {{s}} shared disk", { n, s });
        default:
          // n >= 2 && s >= 2
          return t("{{n}} nodes selected with {{s}} shared disks", { n, s });
      }
    }, [selectedNodes.length, sharedDisksCount, t]);

    const columns: TableColumn<IoK8sApiCoreV1Node>[] = useMemo(
      () => [
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
      ],
      [t]
    );

    const vm = useMemo(
      () => ({
        columns,
        loaded,
        error,
        nodes,
        selectedNodes,
        sharedDisksCount,
        sharedDisksCountMessage,
      }),
      [
        columns,
        loaded,
        error,
        nodes,
        selectedNodes,
        sharedDisksCount,
        sharedDisksCountMessage,
      ]
    );

    useValidateMinimumRequirements(vm);

    return vm;
  };
