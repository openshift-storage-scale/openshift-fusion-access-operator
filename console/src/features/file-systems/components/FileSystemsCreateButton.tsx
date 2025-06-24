import { Button } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";

interface CreateFileSystemButtonProps
  extends Omit<ButtonProps, "variant" | "onClick"> {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  isDisabled?: boolean;
}

export const FileSystemsCreateButton: React.FC<CreateFileSystemButtonProps> = (
  props
) => {
  const { onClick, isLoading, isDisabled, ...buttonProps } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <Button
      {...buttonProps}
      variant="primary"
      onClick={onClick}
      isLoading={isLoading}
      isDisabled={isLoading || isDisabled}
    >
      {t("Create file system")}
    </Button>
  );
};

FileSystemsCreateButton.displayName = "FileSystemsCreateButton";
