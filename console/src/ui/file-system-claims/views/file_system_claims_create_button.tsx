import { Button, Tooltip } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFileSystemClaimsCreateButtonViewModel } from "../view-models/use_file_system_claims_create_button_view_model";

type FileSystemClaimsCreateButtonProps = Omit<
  ButtonProps,
  "variant" | "ref" | "isAriaDisabled" | "aria-describedby"
>;

export const FileSystemClaimsCreateButton: React.FC<
  FileSystemClaimsCreateButtonProps
> = (props) => {
  const { isDisabled, isLoading, ...otherProps } = props;
  const vm = useFileSystemClaimsCreateButtonViewModel();

  return (
    <>
      <Button
        {...otherProps}
        aria-describedby={
          vm.shouldShowTooltip ? "create-file-system-tooltip" : undefined
        }
        isAriaDisabled={isDisabled || vm.isButtonDisabled}
        variant="primary"
        isLoading={isLoading || vm.isButtonLoading}
        ref={vm.tooltip.ref}
      >
        {vm.text}
      </Button>
      {vm.shouldShowTooltip && (
        <Tooltip
          id={vm.tooltip.id}
          content={vm.tooltip.content}
          triggerRef={vm.tooltip.ref}
        />
      )}
    </>
  );
};
FileSystemClaimsCreateButton.displayName = "FileSystemClaimsCreateButton";
