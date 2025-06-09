import type { FileSystem } from "@/shared/types/ibm-spectrum-scale/FileSystem";
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
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
