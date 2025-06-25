import { InProgressIcon, UnknownIcon } from "@patternfly/react-icons";
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  RedExclamationCircleIcon,
  type StorageClass,
} from "@openshift-console/dynamic-plugin-sdk";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import { getName } from "@/shared/utils/console/K8sResourceCommon";
import { VALUE_NOT_AVAILABLE } from "@/constants";
import { useMemo } from "react";
import type { IoK8sApiCoreV1PersistentVolumeClaim } from "@/shared/types/kubernetes/1.30/types";
import {
  useNormalizedK8sWatchResource,
  type NormalizedWatchK8sResult,
} from "@/shared/utils/console/UseK8sWatchResource";
import { isFilesystemInUse } from "../utils/filesystem";

export interface FileSystemTableRowViewModel {
  name: string;
  status:
    | "unknown"
    | "creating"
    | "deleting"
    | "healthy"
    | "not-healthy"
    | "failed";
  title: string;
  description?: string;
  Icon: React.ReactNode;
  rawCapacity: string;
  persistentVolumeClaims: NormalizedWatchK8sResult<
    IoK8sApiCoreV1PersistentVolumeClaim[]
  >;
  storageClasses: NormalizedWatchK8sResult<StorageClass[]>;
  isInUse: boolean;
}

export const useFileSystemTableRowViewModel = (
  fileSystem: FileSystem
): FileSystemTableRowViewModel => {
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

  const { name, rawCapacity } = useMemo(
    () => ({
      name: getName(fileSystem) ?? VALUE_NOT_AVAILABLE,
      // Currently we support creating only a single file system pool
      rawCapacity:
        fileSystem.status?.pools?.[0].totalDiskSize ?? VALUE_NOT_AVAILABLE,
    }),
    [fileSystem]
  );

  const isInUse = useMemo(
    () =>
      isFilesystemInUse(
        fileSystem,
        storageClasses.data ?? [],
        persistentVolumeClaims.data ?? []
      ),
    [fileSystem, persistentVolumeClaims.data, storageClasses.data]
  );

  if (fileSystem.metadata?.deletionTimestamp) {
    return {
      name,
      rawCapacity,
      persistentVolumeClaims,
      storageClasses,
      isInUse,
      status: "deleting",
      title: t("Deleting"),
      Icon: InProgressIcon,
    };
  }

  if (!fileSystem.status?.conditions?.length) {
    return {
      name,
      rawCapacity,
      persistentVolumeClaims,
      storageClasses,
      isInUse,
      status: "unknown",
      title: t("Unknown"),
      Icon: UnknownIcon,
    };
  }

  const successCondition = fileSystem.status.conditions.find(
    (c) => c.type === "Success"
  );

  const healthyCondition = fileSystem.status.conditions.find(
    (c) => c.type === "Healthy"
  );

  if (
    successCondition?.status === "False" &&
    successCondition.reason === "Failed"
  ) {
    return {
      name,
      rawCapacity,
      persistentVolumeClaims,
      storageClasses,
      isInUse,
      status: "failed",
      title: t("Failed"),
      description: successCondition?.message,
      Icon: RedExclamationCircleIcon,
    };
  }

  if (healthyCondition?.status !== "True") {
    return {
      name,
      rawCapacity,
      persistentVolumeClaims,
      storageClasses,
      isInUse,
      status: "not-healthy",
      title: t("Not healthy"),
      description: healthyCondition?.message,
      Icon: YellowExclamationTriangleIcon,
    };
  }

  return {
    name,
    rawCapacity,
    persistentVolumeClaims,
    storageClasses,
    isInUse,
    status: "healthy",
    title: t("Healthy"),
    Icon: GreenCheckCircleIcon,
  };
};
