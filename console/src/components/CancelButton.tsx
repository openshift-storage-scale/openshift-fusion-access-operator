import { Button } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";

interface CancelButtonProps extends Omit<ButtonProps, "variant" | "onClick"> {
  onCancel?: React.MouseEventHandler<HTMLButtonElement>;
}

export const CancelButton: React.FC<CancelButtonProps> = (props) => {
  const { onCancel, ...buttonProps } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <Button {...buttonProps} variant="link" onClick={onCancel}>
      {t("Cancel")}
    </Button>
  );
};

CancelButton.displayName = "CancelButton";
