import { useEffect, useMemo, useRef, useState } from "react";
import { useDaemonsRepository } from "@/data/repositories/use_daemons_repository";
import { useLocalizationService } from "@/ui/services/use_localization_service";

export const useFileSystemClaimsCreateButtonViewModel = () => {
  const { t } = useLocalizationService();
  const tooltipRef = useRef<HTMLButtonElement>(null);
  const [isDaemonHealthy, setIsDaemonHealthy] = useState(false);
  const daemonsRepository = useDaemonsRepository();

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

  return useMemo(
    () => ({
      text: t("Create file system claim"),
      tooltip: {
        id: "create-file-system-claim-tooltip",
        content: t("Fusion Access for SAN infrastructure is not ready"),
        ref: tooltipRef,
      },
      isDaemonHealthy,
    }),
    [t, isDaemonHealthy],
  );
};
