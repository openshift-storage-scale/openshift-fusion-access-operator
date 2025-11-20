import { useEffect, useMemo, useRef, useState } from "react";
import { useDaemonsRepository } from "@/data/repositories/use_daemons_repository";
import { useLocalizationService } from "@/domain/services/use_localization_service";
import { useLunsUseCase } from "@/domain/use-cases/use_luns_use_case";

export const useFileSystemClaimsCreateButtonViewModel = () => {
  const { t } = useLocalizationService();
  const tooltipRef = useRef<HTMLButtonElement>(null);
  const [isDaemonHealthy, setIsDaemonHealthy] = useState(false);
  const daemonsRepository = useDaemonsRepository();
  const luns = useLunsUseCase();

  useEffect(() => {
    if (daemonsRepository.loaded && daemonsRepository.daemons.length > 0) {
      const [daemon] = daemonsRepository.daemons;
      const daemonStatus = daemon.status?.conditions?.find(
        (condition) =>
          condition.type == "Healthy" && condition.status === "True",
      );

      setIsDaemonHealthy(typeof daemonStatus !== "undefined");
    }
  }, [daemonsRepository.daemons, daemonsRepository.loaded]);

  const hasAvailableLuns = useMemo(() => {
    if (!luns.loaded) {
      return false;
    }
    return luns.data.length > 0;
  }, [luns.loaded, luns.data.length]);

  const tooltipContent = useMemo(() => {
    if (!isDaemonHealthy) {
      return t("Fusion Access for SAN infrastructure is not ready");
    }
    if (!hasAvailableLuns) {
      return t("Can't create file system because there are no LUNs available.");
    }
    return "";
  }, [isDaemonHealthy, hasAvailableLuns, t]);

  const shouldShowTooltip = !isDaemonHealthy || !hasAvailableLuns;

  const isButtonDisabled = useMemo(() => {
    return !isDaemonHealthy || !hasAvailableLuns;
  }, [isDaemonHealthy, hasAvailableLuns]);

  const isButtonLoading = useMemo(() => {
    return !isDaemonHealthy || !luns.loaded;
  }, [isDaemonHealthy, luns.loaded]);

  return useMemo(
    () => ({
      text: t("Create file system claim"),
      tooltip: {
        id: "create-file-system-claim-tooltip",
        content: tooltipContent,
        ref: tooltipRef,
      },
      isDaemonHealthy,
      hasAvailableLuns,
      shouldShowTooltip,
      isButtonDisabled,
      isButtonLoading,
    }),
    [
      t,
      isDaemonHealthy,
      hasAvailableLuns,
      shouldShowTooltip,
      tooltipContent,
      isButtonDisabled,
      isButtonLoading,
    ],
  );
};
