import type {
  K8sResourceCommon,
  TableColumn,
} from "@openshift-console/dynamic-plugin-sdk";
import { useEffect, useMemo, useRef } from "react";
import {
  MINIMUM_AMOUNT_OF_NODES,
  MINIMUM_AMOUNT_OF_NODES_LITERAL,
  MINIMUM_AMOUNT_OF_SHARED_DISKS,
  MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL,
  STORAGE_ROLE_LABEL,
  WORKER_NODE_ROLE_LABEL,
} from "@/constants";
import { useLocalVolumeDiscoveryResultRepository } from "@/data/repositories/use_local_volume_discovery_result_respository";
import { useNodesRepository } from "@/data/repositories/use_nodes_repository";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import type { IoK8sApiCoreV1Node } from "@/shared/types/openshift/4.19/types";
import { hasLabel } from "@/shared/utils/k8s_resource_common";
import { useLocalizationService } from "@/ui/services/use_localization_service";

export const useStorageClusterNodesSelectionTableViewModel = () => {
  const [, dispatch] = useStore<State, Actions>();
  const { t } = useLocalizationService();
  const lvdrsRepository = useLocalVolumeDiscoveryResultRepository();
  const workerNodesRepository = useNodesRepository({
    withLabels: [WORKER_NODE_ROLE_LABEL],
  });

  useEffect(() => {
    if (lvdrsRepository.error) {
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("Failed to load LocalVolumeDiscoveryResults"),
          description: lvdrsRepository.error.message,
          variant: "danger",
        },
      });
    }
  }, [dispatch, lvdrsRepository.error, t]);

  useEffect(() => {
    if (workerNodesRepository.error) {
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("Failed to load Nodes"),
          description: workerNodesRepository.error.message,
          variant: "danger",
        },
      });
    }
  }, [dispatch, workerNodesRepository.error, t]);

  const loaded = useMemo(
    () => workerNodesRepository.loaded && lvdrsRepository.loaded,
    [lvdrsRepository.loaded, workerNodesRepository.loaded],
  );

  const error = useMemo(
    () => workerNodesRepository.error || lvdrsRepository.error,
    [lvdrsRepository.error, workerNodesRepository.error],
  );

  const selectedNodes = useMemo(
    () =>
      workerNodesRepository.nodes.filter((n) =>
        hasLabel(n, STORAGE_ROLE_LABEL),
      ),
    [workerNodesRepository.nodes],
  );

  const sharedDisksCount = useMemo(() => {
    const wwnSetsList = lvdrsRepository.localVolumeDiscoveryResults
      .filter((lvdr) =>
        selectedNodes.find(
          (n) =>
            (n.metadata as K8sResourceCommon["metadata"])?.name ===
            lvdr.spec?.nodeName,
        ),
      )
      .map((lvdr) => lvdr?.status?.discoveredDevices ?? [])
      .map((dd) => new Set(dd.map((d) => d.WWN)));

    return wwnSetsList.length >= 2
      ? wwnSetsList.reduce((previous, current) =>
          previous.intersection(current),
        ).size
      : 0;
  }, [lvdrsRepository.localVolumeDiscoveryResults, selectedNodes]);

  const sharedDisksCountMessage = useMemo(() => {
    const n = selectedNodes.length;
    const s = sharedDisksCount;
    switch (true) {
      case n === 0:
        return t("No nodes selected");
      case n === 1:
        return t("{{n}} node selected", { n });
      case n >= 2 && s === 1:
        return t("{{n}} nodes were selected, sharing {{s}} disk between them", {
          n,
          s,
        });
      default:
        // n >= 2 && s >= 2
        return t(
          "{{n}} nodes were selected, sharing {{s}} disks between them",
          { n, s },
        );
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
    [t],
  );

  const vm = useMemo(
    () => ({
      columns,
      loaded,
      error,
      workerNodes: workerNodesRepository.nodes,
      selectedNodes,
      sharedDisksCount,
      sharedDisksCountMessage,
    }),
    [
      columns,
      loaded,
      error,
      selectedNodes,
      sharedDisksCount,
      sharedDisksCountMessage,
      workerNodesRepository.nodes,
    ],
  );

  useValidateMinimumRequirements(
    loaded,
    selectedNodes.length,
    sharedDisksCount,
  );

  return vm;
};
export type StorageClusterNodesSelectionTableViewModel = ReturnType<
  typeof useStorageClusterNodesSelectionTableViewModel
>;

const useValidateMinimumRequirements = (
  loaded: boolean,
  selectedNodesCount: number,
  sharedDisksCount: number,
) => {
  const [store, dispatch] = useStore<State, Actions>();
  const storeRef = useRef(store);
  storeRef.current = store;

  const { t } = useLocalizationService();

  useEffect(() => {
    if (!loaded) {
      return;
    }

    const conditions: boolean[] = [
      sharedDisksCount < MINIMUM_AMOUNT_OF_SHARED_DISKS,
      selectedNodesCount < MINIMUM_AMOUNT_OF_NODES,
    ];

    if (conditions.some(Boolean)) {
      dispatch({
        type: "global/updateCta",
        payload: { isDisabled: true },
      });
      dispatch({
        type: "global/addAlert",
        payload: {
          key: "minimum-shared-disks-and-nodes",
          title: t("Storage cluster requirements"),
          description: [
            conditions[0]
              ? t(
                  "Selected nodes must share at least {{MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL}} disk",
                  { MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL },
                )
              : "",
            conditions[1]
              ? t(
                  "At least {{MINIMUM_AMOUNT_OF_NODES_LITERAL}} nodes must be selected.",
                  {
                    MINIMUM_AMOUNT_OF_NODES_LITERAL,
                  },
                )
              : "",
          ].filter(Boolean),
          variant: "warning",
          dismiss: () => dispatch({ type: "global/dismissAlert" }),
        },
      });
    } else {
      dispatch({
        type: "global/updateCta",
        payload: { isDisabled: false },
      });
      storeRef.current.alerts
        .find((alert) => alert.key === "minimum-shared-disks-and-nodes")
        ?.dismiss?.();
    }
  }, [dispatch, t, loaded, selectedNodesCount, sharedDisksCount]);
};
