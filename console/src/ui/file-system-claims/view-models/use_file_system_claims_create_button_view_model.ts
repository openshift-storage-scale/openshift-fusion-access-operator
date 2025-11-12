import { useEffect, useRef, useState } from "react";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchDaemon } from "@/shared/hooks/useWatchDaemon";

export const useFileSystemClaimsCreateButtonViewModel = () => {
  const { t } = useFusionAccessTranslations();
  const tooltipRef = useRef<HTMLButtonElement>(null);
  const [isDaemonHealthy, setIsDaemonHealthy] = useState(false);
  const daemon = useWatchDaemon();

  useEffect(() => {
    if (daemon.loaded && Array.isArray(daemon.data) && daemon.data.length > 0) {
      const [daemonData] = daemon.data;
      const daemonStatus = daemonData.status?.conditions?.find(
        (condition) =>
          condition.type == "Healthy" && condition.status === "True",
      );

      setIsDaemonHealthy(typeof daemonStatus !== "undefined");
    }
  }, [daemon.loaded, daemon.data]);

  return {
    text: t("Create file system claim"),
    tooltip: {
      id: "create-file-system-claim-tooltip",
      content: t("Fusion Access for SAN infrastructure is not ready"),
      ref: tooltipRef,
    },
    isDaemonHealthy,
  };
};
