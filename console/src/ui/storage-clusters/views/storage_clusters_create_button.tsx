import { Button } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useLocalizationService } from "@/ui/services/use_localization_service";

type CreateStorageClusterButtonProps = Omit<ButtonProps, "variant">;

export const StorageClustersCreateButton: React.FC<
  CreateStorageClusterButtonProps
> = (props) => {
  const { t } = useLocalizationService();

  return (
    <Button {...props} variant="primary">
      {t("Create storage cluster")}
    </Button>
  );
};

StorageClustersCreateButton.displayName = "StorageClustersCreateButton";
