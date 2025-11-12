import { useWatchFusionAccess } from "@/shared/hooks/useWatchFusionAccess";

export const useFusionAccessesRepository = () => {
  const result = useWatchFusionAccess();

  return {
    loaded: result.loaded,
    error: result.error,
    fusionAccesses: result.data ? [result.data] : [],
  };
};


