import { SC_PROVISIONER } from "@/constants";
import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import type { IoK8sApiCoreV1PersistentVolumeClaim } from "@/shared/types/kubernetes/1.30/types";
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  type StorageClass,
} from "@openshift-console/dynamic-plugin-sdk";
import { InProgressIcon, UnknownIcon } from "@patternfly/react-icons";
import type { TFunction } from "react-i18next";

export type FilesystemStatus = {
  id: "deleting" | "healthy" | "unknown" | "creating" | "not-healthy";
  title: string;
  icon: React.ReactNode;
  description?: string;
};

export const getFilesystemStatus = (
  fs: FileSystem,
  t: TFunction
): FilesystemStatus => {
  if (fs.metadata?.deletionTimestamp) {
    return {
      id: "deleting",
      title: t("Deleting"),
      icon: <InProgressIcon />,
    };
  }

  if (!fs.status?.conditions?.length) {
    return {
      id: "unknown",
      title: t("Unknown"),
      icon: <UnknownIcon />,
    };
  }

  const successCondition = fs.status.conditions.find(
    (c) => c.type === "Success"
  );

  if (successCondition?.status !== "True") {
    return {
      id: "creating",
      title: t("Creating"),
      description: successCondition?.message,
      icon: <InProgressIcon />,
    };
  }

  const healthyCondition = fs.status.conditions.find(
    (c) => c.type === "Healthy"
  );

  if (healthyCondition?.status !== "True") {
    return {
      id: "not-healthy",
      title: t("Not healthy"),
      description: healthyCondition?.message,
      icon: <YellowExclamationTriangleIcon />,
    };
  }

  return {
    id: "healthy",
    title: t("Healthy"),
    icon: <GreenCheckCircleIcon />,
  };
};

export const getFileSystemScs = (
  fileSystem: FileSystem,
  scs: StorageClass[]
) => {
  return scs.filter((sc) => {
    if (sc.provisioner === SC_PROVISIONER) {
      const fsName = (sc.parameters as { volBackendFs?: string })?.volBackendFs;
      return fsName === fileSystem.metadata?.name;
    }
    return false;
  });
};

export const isFilesystemInUse = (
  fileSystem: FileSystem,
  scs: StorageClass[],
  pvcs: IoK8sApiCoreV1PersistentVolumeClaim[]
) => {
  const fsScs = getFileSystemScs(fileSystem, scs).map(
    (sc) => sc.metadata?.name
  );
  return pvcs.some(
    (pvc) =>
      pvc.spec?.storageClassName && fsScs.includes(pvc.spec?.storageClassName)
  );
};
