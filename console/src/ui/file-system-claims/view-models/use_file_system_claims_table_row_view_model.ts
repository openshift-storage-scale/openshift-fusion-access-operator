import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from "@openshift-console/dynamic-plugin-sdk";
import { InProgressIcon, UnknownIcon } from "@patternfly/react-icons";
import { useMemo } from "react";
import { SPECTRUM_SCALE_NAMESPACE, VALUE_NOT_AVAILABLE } from "@/constants";
import { useFileSystemsRepository } from "@/data/repositories/use_file_systems_repository";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import type { Filesystem } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Filesystem";
import { getName } from "@/shared/utils/k8s_resource_common";
import { useLocalizationService } from "@/ui/services/use_localization_service";

export const useFileSystemClaimsTableRowViewModel = (
  fileSystemClaim: FileSystemClaim,
) => {
  const { t } = useLocalizationService();
  const fileSystemName = getName(fileSystemClaim)!;
  const fileSystemsRepository = useFileSystemsRepository({
    name: fileSystemName,
    namespace: SPECTRUM_SCALE_NAMESPACE,
  });
  const fileSystem = fileSystemsRepository.fileSystems[0];
  const rawCapacity =
    fileSystem?.status?.pools?.[0].totalDiskSize ?? VALUE_NOT_AVAILABLE;
  const fileSystemClaimConditions = fileSystemClaim.status?.conditions ?? [];
  const fileSystemClaimReadyCondition = fileSystemClaimConditions.find(
    (c) => c.type === "Ready",
  );
  const fileSystemClaimDeletionBlockedCondition =
    fileSystemClaimConditions.find((c) => c.type === "DeletionBlocked");
  const status = useMemo(() => {
    switch (true) {
      case fileSystemClaimReadyCondition?.status === "False" &&
        fileSystemClaimReadyCondition?.reason === "ProvisioningInProgress":
        return {
          title: t("Provisioning"),
          message: fileSystemClaimReadyCondition.message,
          Icon: InProgressIcon,
        };
      case fileSystemClaimDeletionBlockedCondition?.status === "True":
        return {
          title: t("Deletion blocked"),
          message:
            "<bold>WARNING:</bold> Deleting the filesystem resource will result in loss of data. To confirm this action, please label the filesystem <FileSystemNameLink>{{fileSystemName}}</FileSystemNameLink> with <label>{{label}}</label> and try again.",
          Icon: YellowExclamationTriangleIcon,
        };
      case fileSystemClaimReadyCondition?.status === "False" &&
        fileSystemClaimReadyCondition?.reason === "DeletionRequested":
        return {
          title: t("Deleting"),
          message: fileSystemClaimReadyCondition.message,
          Icon: InProgressIcon,
        };
      case fileSystemClaimReadyCondition?.status === "True":
        return {
          title: t("Ready"),
          message: fileSystemClaimReadyCondition.message,
          Icon: GreenCheckCircleIcon,
        };
      default:
        return {
          title: t("Unknown"),
          message: t("No status reported"),
          Icon: UnknownIcon,
        };
    }
  }, [
    t,
    fileSystemClaimDeletionBlockedCondition?.status,
    fileSystemClaimReadyCondition?.message,
    fileSystemClaimReadyCondition?.status,
    fileSystemClaimReadyCondition?.reason,
  ]);

  return useMemo(
    () => ({
      fileSystemName,
      status,
      rawCapacity,
    }),
    [rawCapacity, fileSystemName, status],
  );
};
