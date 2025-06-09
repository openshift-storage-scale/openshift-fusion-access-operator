import { Button } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";

interface CreateStorageClusterButtonProps
  extends Omit<ButtonProps, "variant" | "onClick"> {
  onCreateStorageCluster?: React.MouseEventHandler<HTMLButtonElement>;
}

export const StorageClustersCreateButton: React.FC<
  CreateStorageClusterButtonProps
> = (props) => {
  const { onCreateStorageCluster, ...buttonProps } = props;
  const { t } = useFusionAccessTranslations();

  return (
    <Button {...buttonProps} variant="primary" onClick={onCreateStorageCluster}>
      {t("Create storage cluster")}
    </Button>
  );
};

StorageClustersCreateButton.displayName = "StorageClustersCreateButton";
