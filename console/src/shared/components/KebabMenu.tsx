import { useState, useCallback } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
} from "@patternfly/react-core";
import type { DropdownProps } from "@patternfly/react-core/dist/esm/components/Dropdown/Dropdown.d.ts";
import type { DropdownItemProps } from "@patternfly/react-core/dist/esm/components/Dropdown/DropdownItem.d.ts";
import type {
  MenuToggleElement,
  MenuToggleProps,
} from "@patternfly/react-core/dist/esm/components/MenuToggle/MenuToggle.d.ts";
import { EllipsisVIcon } from "@patternfly/react-icons";

export interface KebabMenuProps {
  isDisabled?: boolean;
  items?: Array<DropdownItemProps>;
}

export const KebabMenu: React.FC<KebabMenuProps> = (props) => {
  const { isDisabled = false, items = [] } = props;

  const [isOpen, setIsOpen] = useState(false);

  const handleClickMenuToggle = useCallback<
    NonNullable<MenuToggleProps["onClick"]>
  >(() => setIsOpen(!isOpen), [isOpen]);

  const handleSelectDropdown = useCallback<
    NonNullable<DropdownProps["onSelect"]>
  >(() => {
    setIsOpen(false);
  }, []);

  const handleOpenChangeDropdown = useCallback<
    NonNullable<DropdownProps["onOpenChange"]>
  >((isOpen) => setIsOpen(isOpen), []);

  const dropdownToggle = useCallback<
    (toggleRef: React.RefObject<MenuToggleElement>) => React.ReactNode
  >(
    (toggleRef) => (
      <MenuToggle
        ref={toggleRef}
        aria-label="kebab dropdown toggle"
        variant="plain"
        onClick={handleClickMenuToggle}
        isExpanded={isOpen}
        isDisabled={isDisabled}
        icon={<EllipsisVIcon />}
      />
    ),
    [handleClickMenuToggle, isDisabled, isOpen]
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={handleSelectDropdown}
      onOpenChange={handleOpenChangeDropdown}
      toggle={dropdownToggle}
      shouldFocusToggleOnSelect
      popperProps={{ position: "right" }}
      style={{ whiteSpace: "nowrap" }}
    >
      <DropdownList>
        {items.map((item) => (
          <DropdownItem {...item} />
        ))}
      </DropdownList>
    </Dropdown>
  );
};
KebabMenu.displayName = "KebabMenu";
