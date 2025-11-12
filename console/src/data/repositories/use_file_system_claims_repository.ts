import { useK8sModel } from "@openshift-console/dynamic-plugin-sdk";
import { useCallback } from "react";
import { SPECTRUM_SCALE_NAMESPACE } from "@/constants";
import { sleep } from "@/pkg/async";
import { useWatchFileSystemClaim } from "@/shared/hooks/useWatchFileSystemClaim";
import { groupVersionKind } from "../models/file_system_claim_gvk";
import { fileSystemClaimsService } from "../services/file_system_claims_service";

const IN_FLIGHT_SLEEP_MS = 500;

export const useFileSystemClaimsRepository = () => {
  const result = useWatchFileSystemClaim();
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

  return {
    loaded: result.loaded,
    error: result.error,
    fileSystemClaims: result.data ?? [],
    create,
  };
};
