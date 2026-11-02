/**
 * DropdownMenu parts: the items, groups, labels, and separators a menu's
 * `content` is built from. They're the menu parts `ContextMenu` shares,
 * under this menu's prefix, plus the trigger's chevron. Deviations are
 * recorded on `DropdownMenu`.
 *
 * @see https://www.radix-ui.com/themes/docs/components/dropdown-menu
 */

import { mergeProps, type JSX } from 'solid-js';
import IconChevronDown from 'virtual:icons/mdi/chevron-down';
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  type MenuCheckboxItemProps,
  type MenuChecked,
  type MenuColor,
  type MenuGroupProps,
  type MenuItemColor,
  type MenuItemProps,
  type MenuLabelProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuSeparatorProps,
} from '../_internal/menu/parts';

/** Palette a menu highlights its items in. */
export type DropdownMenuColor = MenuColor;

/** Semantic palette for a single item, e.g. `'danger'` for a destructive action. */
export type DropdownMenuItemColor = MenuItemColor;

/** Tri-state value of a checkbox item. */
export type DropdownMenuChecked = MenuChecked;

/** `DropdownMenuItem` props. */
export type DropdownMenuItemProps = MenuItemProps;

/** An action in a menu. */
export const DropdownMenuItem = MenuItem;

/** `DropdownMenuCheckboxItem` props. */
export type DropdownMenuCheckboxItemProps = MenuCheckboxItemProps;

/** A menu item that toggles a setting on and off. */
export const DropdownMenuCheckboxItem = MenuCheckboxItem;

/** `DropdownMenuRadioGroup` props. */
export type DropdownMenuRadioGroupProps = MenuRadioGroupProps;

/** A set of `DropdownMenuRadioItem`s, one of which is chosen. */
export const DropdownMenuRadioGroup = MenuRadioGroup;

/** `DropdownMenuRadioItem` props. */
export type DropdownMenuRadioItemProps = MenuRadioItemProps;

/** One choice in a `DropdownMenuRadioGroup`. */
export const DropdownMenuRadioItem = MenuRadioItem;

/** `DropdownMenuGroup` props. */
export type DropdownMenuGroupProps = MenuGroupProps;

/**
 * A run of related items. Name it with `aria-labelledby` pointing at a
 * `DropdownMenuLabel`, or with `aria-label`.
 */
export const DropdownMenuGroup = MenuGroup;

/** `DropdownMenuLabel` props. */
export type DropdownMenuLabelProps = MenuLabelProps;

/** A heading over a run of items. Not focusable or selectable. */
export const DropdownMenuLabel = MenuLabel;

/** `DropdownMenuSeparator` props. */
export type DropdownMenuSeparatorProps = MenuSeparatorProps;

/** A rule between groups of items. */
export const DropdownMenuSeparator = MenuSeparator;

/** `DropdownMenuTriggerIcon` props. */
export type DropdownMenuTriggerIconProps = JSX.SvgSVGAttributes<SVGSVGElement>;

/** The chevron a trigger shows to say it opens a menu. */
export const DropdownMenuTriggerIcon = (
  rawProps: DropdownMenuTriggerIconProps,
) => {
  const props = mergeProps({ 'aria-hidden': true } as const, rawProps);

  return <IconChevronDown {...props} />;
};
