import { useMemo } from "react";
import { useFusionAccessesRepository } from "@/data/repositories/use_fusion_accesses_repository";
import { useStorageClustersRepository } from "@/data/repositories/use_storage_clusters_repository";

export const useFusionAccessHomeScreenViewModel = () => {
  const fusionAccessesRepository = useFusionAccessesRepository();
  const storageClustersRepository = useStorageClustersRepository();

  const loaded = useMemo(
    () =>
      fusionAccessesRepository.loaded &&
      storageClustersRepository.loaded &&
      fusionAccessesRepository.isReady,
    [
      fusionAccessesRepository.loaded,
      storageClustersRepository.loaded,
      fusionAccessesRepository.isReady,
    ],
  );

  const error = useMemo(
    () => fusionAccessesRepository.error || storageClustersRepository.error,
    [fusionAccessesRepository.error, storageClustersRepository.error],
  );

  return useMemo(
    () => ({
      loaded,
      error,
      isFusionAccessReady: fusionAccessesRepository.isReady,
      hasStorageClusterNotBeenCreated:
        storageClustersRepository.hasNotBeenCreated,
    }),
    [
      loaded,
      error,
      fusionAccessesRepository.isReady,
      storageClustersRepository.hasNotBeenCreated,
    ],
  );
};
