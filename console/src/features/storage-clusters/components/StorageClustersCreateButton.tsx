import { Button } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";

type CreateStorageClusterButtonProps = Omit<ButtonProps, "variant">;

export const StorageClustersCreateButton: React.FC<
  CreateStorageClusterButtonProps
> = (props) => {
  const { onClick, ...buttonProps } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <Button {...buttonProps} variant="primary">
      {t("Create storage cluster")}
    </Button>
  );
};

StorageClustersCreateButton.displayName = "StorageClustersCreateButton";
