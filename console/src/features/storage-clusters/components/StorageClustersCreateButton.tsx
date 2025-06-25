import { Button } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";

type CreateStorageClusterButtonProps = Omit<ButtonProps, "variant">;

export const StorageClustersCreateButton: React.FC<
  CreateStorageClusterButtonProps
> = (props) => {
  const { t } = useFusionAccessTranslations();

  return (
    <Button {...props} variant="primary">
      {t("Create storage cluster")}
    </Button>
  );
};

StorageClustersCreateButton.displayName = "StorageClustersCreateButton";
