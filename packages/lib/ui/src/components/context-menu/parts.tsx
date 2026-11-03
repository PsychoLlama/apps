/**
 * ContextMenu parts: the items, groups, labels, and separators a menu's
 * `content` is built from. They're the menu parts `DropdownMenu`
 * shares, under this menu's prefix. Deviations are recorded on
 * `ContextMenu`.
 *
 * @see https://www.radix-ui.com/themes/docs/components/context-menu
 */

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
export type ContextMenuColor = MenuColor;

/** Semantic palette for a single item, e.g. `'danger'` for a destructive action. */
export type ContextMenuItemColor = MenuItemColor;

/** Tri-state value of a checkbox item. */
export type ContextMenuChecked = MenuChecked;

/** `ContextMenuItem` props. */
export type ContextMenuItemProps = MenuItemProps;

/** An action in a menu. */
export const ContextMenuItem = MenuItem;

/** `ContextMenuCheckboxItem` props. */
export type ContextMenuCheckboxItemProps = MenuCheckboxItemProps;

/** A menu item that toggles a setting on and off. */
export const ContextMenuCheckboxItem = MenuCheckboxItem;

/** `ContextMenuRadioGroup` props. */
export type ContextMenuRadioGroupProps = MenuRadioGroupProps;

/** A set of `ContextMenuRadioItem`s, one of which is chosen. */
export const ContextMenuRadioGroup = MenuRadioGroup;

/** `ContextMenuRadioItem` props. */
export type ContextMenuRadioItemProps = MenuRadioItemProps;

/** One choice in a `ContextMenuRadioGroup`. */
export const ContextMenuRadioItem = MenuRadioItem;

/** `ContextMenuGroup` props. */
export type ContextMenuGroupProps = MenuGroupProps;

/**
 * A run of related items. Name it with `aria-labelledby` pointing at a
 * `ContextMenuLabel`, or with `aria-label`.
 */
export const ContextMenuGroup = MenuGroup;

/** `ContextMenuLabel` props. */
export type ContextMenuLabelProps = MenuLabelProps;

/** A heading over a run of items. Not focusable or selectable. */
export const ContextMenuLabel = MenuLabel;

/** `ContextMenuSeparator` props. */
export type ContextMenuSeparatorProps = MenuSeparatorProps;

/** A rule between groups of items. */
export const ContextMenuSeparator = MenuSeparator;
