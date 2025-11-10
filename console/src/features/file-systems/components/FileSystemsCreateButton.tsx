import { Button, Tooltip } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useWatchDaemon } from "@/shared/hooks/useWatchDaemon";
import { useEffect, useRef, useState } from "react";

type CreateFileSystemButtonProps = Omit<ButtonProps, "variant">;

export const FileSystemsCreateButton: React.FC<CreateFileSystemButtonProps> = (
  props
) => {
  const { isDisabled, ...otherProps } = props;
  const { t } = useFusionAccessTranslations();

  const [isDaemonHealthy, setIsDaemonHealthy] = useState(false);
  const tooltipRef = useRef<HTMLButtonElement>(null);

  const daemon = useWatchDaemon();

  useEffect(() => {
    if (daemon.loaded && Array.isArray(daemon.data) && daemon.data.length > 0) {
      const [daemonData] = daemon.data;
      const daemonStatus = daemonData.status?.conditions?.find(
        (condition) =>
          condition.type == "Healthy" && condition.status === "True"
      );

      setIsDaemonHealthy(typeof daemonStatus !== "undefined");
    }
  }, [daemon.loaded, daemon.data]);

  return (
    <>
      <Button
        aria-describedby="create-file-system-tooltip"
        {...otherProps}
        isAriaDisabled={isDisabled || !isDaemonHealthy}
        variant="primary"
        ref={tooltipRef}
      >
        {t("Create file system")}
      </Button>
      {!isDaemonHealthy && (
        <Tooltip
          id="create-file-system-tooltip"
          content={t("Fusion Access for SAN infrastructure is not ready")}
          triggerRef={tooltipRef}
        />
      )}
    </>
  );
};

FileSystemsCreateButton.displayName = "FileSystemsCreateButton";
