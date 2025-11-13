import {
  useK8sModel,
  type WatchK8sResource,
} from "@openshift-console/dynamic-plugin-sdk";
import { useCallback, useMemo } from "react";
import { IN_FLIGHT_SLEEP_MS, SPECTRUM_SCALE_NAMESPACE } from "@/constants";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import { sleep } from "@/shared/utils/async";
import { useNormalizedK8sWatchResource } from "@/shared/utils/use_k8s_watch_resource";
import { groupVersionKind } from "../models/file_system_claim_gvk";
import { fileSystemClaimsService } from "../services/file_system_claims_service";

type Options = Omit<
  WatchK8sResource,
  "groupVersionKind" | "namespaced" | "namespace" | "limit" | "isList"
>;

export const useFileSystemClaimsRepository = (options: Options = {}) => {
  const result = useWatchFileSystemClaim(options);
  const [model, inFlight] = useK8sModel(groupVersionKind);
  const create = useCallback(
    async (
      fileSystemName: string,
      devices: string[],
      namespace: string = SPECTRUM_SCALE_NAMESPACE,
    ) => {
      while (inFlight) {
        await sleep(IN_FLIGHT_SLEEP_MS);
      }

      return fileSystemClaimsService.create(
        model,
        fileSystemName,
        devices,
        namespace,
      );
    },
    [model, inFlight],
  );

  return useMemo(
    () => ({
      loaded: result.loaded,
      error: result.error,
      fileSystemClaims: result.data ?? [],
      create,
    }),
    [result.loaded, result.error, result.data, create],
  );
};

const useWatchFileSystemClaim = (options: Options = {}) =>
  useNormalizedK8sWatchResource<FileSystemClaim>({
    ...options,
    isList: true,
    namespaced: true,
    namespace: SPECTRUM_SCALE_NAMESPACE,
    groupVersionKind,
  });
