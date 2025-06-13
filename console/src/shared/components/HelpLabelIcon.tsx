import { memo } from "react";
import { HelpIcon } from "@patternfly/react-icons";
import { Popover } from "@patternfly/react-core";
import type { PopoverProps } from "@patternfly/react-core/dist/js/components/Popover";

interface HelpLabelIconProps {
  popoverContent: PopoverProps["bodyContent"];
}

export const HelpLabelIcon: React.FC<HelpLabelIconProps> = memo((props) => {
  const { popoverContent } = props;

  return (
    <Popover bodyContent={popoverContent}>
      <button
        onClick={(e) => e.preventDefault()}
        className={"pf-v5-c-form__group-label-help"}
      >
        <HelpIcon />
      </button>
    </Popover>
  );
});
HelpLabelIcon.displayName = "HelpLabelIcon";
