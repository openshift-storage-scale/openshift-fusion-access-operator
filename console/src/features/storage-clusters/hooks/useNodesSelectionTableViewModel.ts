import { useMemo } from "react";
import type { IoK8sApiCoreV1Node } from "@/shared/types/kubernetes/1.30/types";
import { STORAGE_ROLE_LABEL, WORKER_NODE_ROLE_LABEL } from "@/constants";
import { hasLabel } from "@/shared/utils/console/K8sResourceCommon";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import type { TableColumn } from "@openshift-console/dynamic-plugin-sdk";
import { useValidateMinimumRequirements } from "./useValidateMinimumRequirements";

export interface NodesSelectionTableViewModel {
  columns: TableColumn<IoK8sApiCoreV1Node>[];
  isLoaded: boolean;
  loadError: string | null;
  nodes: IoK8sApiCoreV1Node[] | null;
  selectedNodes: IoK8sApiCoreV1Node[];
  sharedDisksCount: number;
  sharedDisksCountMessage: string;
}

export const useNodesSelectionTableViewModel =
  (): NodesSelectionTableViewModel => {
    const { t } = useFusionAccessTranslations();

    const [lvdrs, lvdrsLoaded, lvdrsLoadError] =
      useWatchLocalVolumeDiscoveryResult();

    const [nodes, nodesLoaded, nodesLoadError] = useWatchNode({
      withLabels: [WORKER_NODE_ROLE_LABEL],
    });

    const isLoaded = useMemo(
      () => nodesLoaded && lvdrsLoaded,
      [lvdrsLoaded, nodesLoaded]
    );

    const loadError = useMemo(
      () =>
        (nodesLoadError instanceof Error
          ? nodesLoadError.message
          : nodesLoadError) ||
        (lvdrsLoadError instanceof Error
          ? lvdrsLoadError.message
          : lvdrsLoadError),
      [lvdrsLoadError, nodesLoadError]
    );

    const selectedNodes = useMemo(
      () => (nodes ?? []).filter((n) => hasLabel(n, STORAGE_ROLE_LABEL)),
      [nodes]
    );

    const sharedDisksCount = useMemo(() => {
      const wwnSetsList = (lvdrs ?? [])
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
        isLoaded,
        loadError,
        nodes,
        selectedNodes,
        sharedDisksCount,
        sharedDisksCountMessage,
      }),
      [
        columns,
        isLoaded,
        loadError,
        nodes,
        selectedNodes,
        sharedDisksCount,
        sharedDisksCountMessage,
      ]
    );

    useValidateMinimumRequirements(vm);

    return vm;
  };
