import { Button } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";

type CreateFileSystemButtonProps = Omit<ButtonProps, "variant">;

export const FileSystemsCreateButton: React.FC<CreateFileSystemButtonProps> = (
  props
) => {
  const { onClick, isLoading, isDisabled, ...buttonProps } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <Button {...buttonProps} variant="primary">
      {t("Create file system")}
    </Button>
  );
};

FileSystemsCreateButton.displayName = "FileSystemsCreateButton";
