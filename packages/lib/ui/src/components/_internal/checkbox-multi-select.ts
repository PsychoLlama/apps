/**
 * Group wiring shared by the multi-select checkbox family
 * (`CheckboxGroup` and `CheckboxCards`). Both render each option as a
 * `<Checkbox>` bound to one value in a shared `string[]`; this module
 * owns that binding so the toggle math and the group/item precedence
 * rules for `disabled` / `required` live in one place.
 *
 * Each component keeps its own context (an item from one family must
 * not resolve inside the other's root) and extends
 * `MultiSelectState` with its own visual config.
 */

import type { Accessor } from 'solid-js';
import type { CheckboxProps } from '../checkbox/checkbox';

/** Group-level state every multi-select checkbox root provides. */
export interface MultiSelectState {
  /** Shared `name` applied to every input. */
  name: string;
  value: Accessor<readonly string[]>;
  disabled: Accessor<boolean>;
  required: Accessor<boolean>;

  /**
   * Records the user's selection. The item passes the next array
   * (existing values plus or minus its own) and the root forwards it
   * to the consumer's `onValueChange`.
   */
  onValueChange: (value: string[]) => void;
}

/** Item-level overrides that combine with the group state. */
export interface MultiSelectItemState {
  /** Value this item contributes to the group's array when checked. */
  value: string;

  /** Combines with the group's `disabled` — either one disables. */
  disabled?: boolean;

  /** Overrides the group's `required` when set. */
  required?: boolean;
}

/** The `Checkbox` props an item derives from its group. */
export type MultiSelectItemBinding = Required<
  Pick<
    CheckboxProps,
    'name' | 'value' | 'checked' | 'disabled' | 'required' | 'onCheckedChange'
  >
>;

/**
 * Bind one item to its group. Returns a reactive props object (getters,
 * so it survives a JSX spread) to spread onto the item's `<Checkbox>`.
 */
export const bindMultiSelectItem = (
  group: MultiSelectState,
  item: MultiSelectItemState,
): MultiSelectItemBinding => ({
  get name() {
    return group.name;
  },
  get value() {
    return item.value;
  },
  get checked() {
    return group.value().includes(item.value);
  },
  get disabled() {
    return group.disabled() || item.disabled === true;
  },
  get required() {
    return item.required ?? group.required();
  },
  onCheckedChange: (next) => {
    const current = group.value();
    group.onValueChange(
      next
        ? [...current, item.value]
        : current.filter((existing) => existing !== item.value),
    );
  },
});
