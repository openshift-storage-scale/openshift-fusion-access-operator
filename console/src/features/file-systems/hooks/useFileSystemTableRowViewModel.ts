import { useMemo } from "react";
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  RedExclamationCircleIcon,
  type StorageClass,
  type ColoredIconProps,
} from "@openshift-console/dynamic-plugin-sdk";
import { InProgressIcon, UnknownIcon } from "@patternfly/react-icons";
import type { SVGIconProps } from "@patternfly/react-icons/dist/esm/createIcon";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { getName } from "@/shared/utils/console/K8sResourceCommon";
import { VALUE_NOT_AVAILABLE } from "@/constants";
import type { IoK8sApiCoreV1PersistentVolumeClaim } from "@/shared/types/kubernetes/1.30/types";
import { useNormalizedK8sWatchResource } from "@/shared/utils/console/UseK8sWatchResource";
import { isFilesystemInUse } from "../utils/Filesystem";

export const useFileSystemTableRowViewModel = (fileSystem: FileSystem) => {
  const { t } = useFusionAccessTranslations();

  const persistentVolumeClaims =
    useNormalizedK8sWatchResource<IoK8sApiCoreV1PersistentVolumeClaim>({
      isList: true,
      namespaced: true,
      groupVersionKind: {
        version: "v1",
        kind: "PersistentVolumeClaim",
      },
    });

  const storageClasses = useNormalizedK8sWatchResource<StorageClass>({
    isList: true,
    namespaced: true,
    groupVersionKind: {
      group: "storage.k8s.io",
      version: "v1",
      kind: "StorageClass",
    },
  });

  const { name, rawCapacity } = useMemo<{ name: string; rawCapacity: string }>(
    () => ({
      name: getName(fileSystem) ?? VALUE_NOT_AVAILABLE,
      // Currently we support creating only a single file system pool
      rawCapacity:
        fileSystem.status?.pools?.[0].totalDiskSize ?? VALUE_NOT_AVAILABLE,
    }),
    [fileSystem]
  );

  const isInUse = useMemo<boolean>(
    () =>
      isFilesystemInUse(
        fileSystem,
        storageClasses.data ?? [],
        persistentVolumeClaims.data ?? []
      ),
    [fileSystem, persistentVolumeClaims.data, storageClasses.data]
  );

  const hasDeletionTimestamp = Object.hasOwn(
    fileSystem.metadata ?? {},
    "deletionTimestamp"
  );

  const conditions = useMemo(
    () => fileSystem.status?.conditions ?? [],
    [fileSystem.status?.conditions]
  );

  const { description, status, title, Icon } = useMemo<{
    status:
      | "unknown"
      | "creating"
      | "ready"
      | "not-ready"
      | "deleting"
      | "failed";
    title: string;
    description?: Partial<Record<"Success" | "Healthy", string>>;
    Icon:
      | React.ComponentClass<SVGIconProps, unknown>
      | React.FC<ColoredIconProps>;
  }>(() => {
    const successCondition = conditions.find((c) => c.type === "Success");
    const healthyCondition = conditions.find((c) => c.type === "Healthy");

    switch (true) {
      case hasDeletionTimestamp:
        return {
          status: "deleting",
          title: t("Deleting"),
          Icon: InProgressIcon,
        };
      case successCondition?.reason === "Failed":
        return {
          status: "failed",
          title: t("Failed"),
          description: {
            Success: successCondition.message,
            ...(healthyCondition?.reason !== "NotReported" && {
              Healthy: healthyCondition?.message,
            }),
          },
          Icon: RedExclamationCircleIcon,
        };
      case [
        "FilesystemNotEstablished",
        "LocalDiskNotReady",
        "LocalDiskWrongType",
      ].includes(successCondition?.reason ?? "$ENOMATCH$"):
        return {
          status: "creating",
          title: t("Creating"),
          description: {
            Success: successCondition?.message,
            ...(healthyCondition?.reason !== "NotReported" && {
              Healthy: healthyCondition?.message,
            }),
          },
          Icon: InProgressIcon,
        };
      case successCondition?.reason === "Created" &&
        healthyCondition?.reason === "Degraded":
        return {
          status: "not-ready",
          title: t("Not ready"),
          description: {
            Success: successCondition.message,
            Healthy: healthyCondition?.message,
          },
          Icon: YellowExclamationTriangleIcon,
        };
      case successCondition?.reason === "Created" &&
        healthyCondition?.reason === "Healthy":
        return {
          status: "ready",
          title: t("Ready"),
          description: {
            Success: successCondition.message,
            Healthy: healthyCondition.message,
          },
          Icon: GreenCheckCircleIcon,
        };
      default:
        return {
          status: "unknown",
          title: t("Unknown"),
          description: {
            Success:
              successCondition?.message ??
              t("No {{condition}} condition reported", {
                condition: "Success",
              }),
            Healthy:
              healthyCondition?.message ??
              t("No {{condition}} condition reported", {
                condition: "Healthy",
              }),
          },
          Icon: UnknownIcon,
        };
    }
  }, [conditions, hasDeletionTimestamp, t]);

  return useMemo(
    () =>
      ({
        name,
        rawCapacity,
        persistentVolumeClaims,
        storageClasses,
        isInUse,
        status,
        title,
        description,
        Icon,
      }) as const,
    [
      Icon,
      description,
      isInUse,
      name,
      persistentVolumeClaims,
      rawCapacity,
      status,
      storageClasses,
      title,
    ]
  );
};

export type FileSystemTableRowViewModel = ReturnType<
  typeof useFileSystemTableRowViewModel
>;
