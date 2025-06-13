import { Button } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { DownloadIcon } from "@patternfly/react-icons";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";

interface DownloadLogsButtonProps
  extends Omit<ButtonProps, "variant" | "onClick"> {
  onDownloadLogs?: React.MouseEventHandler<HTMLButtonElement>;
  isDisabled?: boolean;
}

export const DownloadLogsButton: React.FC<DownloadLogsButtonProps> = (
  props
) => {
  const { onDownloadLogs, ...buttonProps } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <Button {...buttonProps} variant="link" onClick={onDownloadLogs}>
      <DownloadIcon /> {t("Download logs")}
    </Button>
  );
};
DownloadLogsButton.displayName = "DownloadLogsButton";
