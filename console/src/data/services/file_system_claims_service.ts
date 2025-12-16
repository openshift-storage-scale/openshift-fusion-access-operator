import {
  type K8sModel,
  k8sCreate,
} from "@openshift-console/dynamic-plugin-sdk";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import { apiVersion, groupVersionKind } from "../models/file_system_claim_gvk";

export const fileSystemClaimsService = {
  create(
    model: K8sModel,
    name: string,
    devices: string[],
    namespace?: string,
  ): Promise<FileSystemClaim> {
    return k8sCreate<FileSystemClaim>({
      model,
      data: {
        apiVersion,
        kind: groupVersionKind.kind,
        metadata: { name, namespace },
        spec: {
          devices,
        },
      },
    });
  },
};
