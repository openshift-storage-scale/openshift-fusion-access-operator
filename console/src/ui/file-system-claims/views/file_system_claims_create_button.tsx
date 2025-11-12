import { Button, Tooltip } from "@patternfly/react-core";
import type { ButtonProps } from "@patternfly/react-core/dist/js/components/Button";
import { useFileSystemClaimsCreateButtonViewModel } from "../view-models/use_file_system_claims_create_button_view_model";

type FileSystemClaimsCreateButtonProps = Omit<ButtonProps, "variant">;

export const FileSystemClaimsCreateButton: React.FC<
  FileSystemClaimsCreateButtonProps
> = (props) => {
  const { isDisabled, ...otherProps } = props;
  const vm = useFileSystemClaimsCreateButtonViewModel();

  return (
    <>
      <Button
        aria-describedby="create-file-system-tooltip"
        {...otherProps}
        isAriaDisabled={isDisabled || !vm.isDaemonHealthy}
        variant="primary"
        ref={vm.tooltip.ref}
      >
        {vm.text}
      </Button>
      {!vm.isDaemonHealthy && (
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
