import { useWatchStorageCluster } from "@/shared/hooks/useWatchStorageCluster";

export const useStorageClustersRepository = () => {
  const result = useWatchStorageCluster();

  return {
    loaded: result.loaded,
    error: result.error,
    storageClusters: result.data ?? [],
    hasNotBeenCreated: result.loaded && (result.data ?? []).length === 0,
  };
};
