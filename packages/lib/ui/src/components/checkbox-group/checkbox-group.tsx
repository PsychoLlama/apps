/**
 * CheckboxGroup component.
 *
 * Ported from Radix UI Themes CheckboxGroup. Exported as two flat
 * components — `CheckboxGroupRoot` and `CheckboxGroupItem` — composed
 * by the consumer. Each item is a `<Checkbox>` bound to one value in
 * the group's `string[]`.
 *
 * Deviations from Radix:
 * - Composes over the library's `Checkbox` (a native
 *   `<input type="checkbox">`) rather than the primitives'
 *   `<button role="checkbox">`. Items inherit its styling, labeling,
 *   and keyboard behavior; there is no separate `ItemCheckbox` part.
 * - No roving-focus group, so no `dir` / `orientation` / `loop`. Tab
 *   moves through every input in DOM order — the native checkbox
 *   pattern (matches `CheckboxCards`).
 * - Fully controlled — `value` (a `string[]`) and `onValueChange` are
 *   required. No `defaultValue`, no internal signal.
 * - `name` is required (optional upstream), matching `CheckboxCards`.
 * - Items accept a `required` override; upstream only sets it on the
 *   root.
 * - Drops `asChild`. The root is locked to a `<div role="group">`.
 * - `color` accepts every semantic palette token.
 *
 * Deferred deviations (intentionally unaddressed for now):
 * - No `highContrast` variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/checkbox-group
 */

import { mergeProps, splitProps } from 'solid-js';
import type { Component, JSX, ParentComponent } from 'solid-js';
import type { MarginProps } from '../../props/margin';
import type { SkeletonProps } from '../../props/skeleton';
import type { RequiredTestIdProps } from '../../props/test-id';
import { bindMultiSelectItem } from '../_internal/checkbox-multi-select';
import Checkbox, {
  type CheckboxColor,
  type CheckboxProps,
  type CheckboxSize,
  type CheckboxVariant,
} from '../checkbox/checkbox';
import Flex from '../flex/flex';
import {
  CheckboxGroupContext,
  useCheckboxGroupContext,
  type CheckboxGroupContextValue,
} from './context';

/**
 * `CheckboxGroupRoot` props. Renders a `<div role="group">` stacking its
 * items vertically and propagates shared configuration to every
 * `CheckboxGroupItem` inside.
 */
export interface CheckboxGroupRootProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'role'> {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: CheckboxSize;

  /** Visual treatment. @default 'surface' */
  variant?: CheckboxVariant;

  /** Semantic color palette for the checked indicator. @default 'accent' */
  color?: CheckboxColor;

  /**
   * Form-submit name applied to every item. The browser submits one
   * entry per checked item under this name, retrievable as
   * `FormData.getAll(name)`.
   */
  name: string;

  /** Disable every item in the group. @default false */
  disabled?: boolean;

  /**
   * Mark every item as required for HTML5 form validation. Native
   * checkbox `required` validation expects that specific input to be
   * checked, so this is most useful on single-item groups.
   * @default false
   */
  required?: boolean;

  /** Currently checked values. Pass `[]` for an empty selection. */
  value: readonly string[];

  /** Fires when the user toggles any item. */
  onValueChange: (value: string[]) => void;
}

/** Group container. Owns the shared name, value, and visual config. */
export const CheckboxGroupRoot: ParentComponent<CheckboxGroupRootProps> = (
  rawProps,
) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      color: 'accent' as const,
      disabled: false,
      required: false,
    },
    rawProps,
  );
  const [local, rest] = splitProps(props, [
    'size',
    'variant',
    'color',
    'name',
    'disabled',
    'required',
    'value',
    'onValueChange',
  ]);

  const ctx: CheckboxGroupContextValue = {
    get name() {
      return local.name;
    },
    size: () => local.size,
    variant: () => local.variant,
    color: () => local.color,
    value: () => local.value,
    disabled: () => local.disabled,
    required: () => local.required,
    onValueChange: (next) => local.onValueChange(next),
  };

  return (
    <CheckboxGroupContext.Provider value={ctx}>
      <Flex
        {...rest}
        as="div"
        role="group"
        // `data-disabled` rather than `aria-disabled` — matches
        // `CheckboxCards`; every item is already `disabled` natively.
        data-disabled={local.disabled ? '' : undefined}
        direction="column"
        gap={1}
      />
    </CheckboxGroupContext.Provider>
  );
};

/**
 * `CheckboxGroupItem` props. Accepts every `Checkbox` prop except the
 * ones the group owns (checked state, form name, and visual config).
 * `children` becomes the inline label; omit it to render a bare
 * checkbox for custom layouts.
 */
export interface CheckboxGroupItemProps extends Omit<
  CheckboxProps,
  | 'checked'
  | 'onCheckedChange'
  | 'name'
  | 'value'
  | 'disabled'
  | 'required'
  | 'size'
  | 'variant'
  | 'color'
> {
  /** Value added to the group's `value` array when checked. */
  value: string;

  /** Disable just this item. Combines with the group's `disabled`. */
  disabled?: boolean;

  /**
   * Override the group's `required` for this item. When omitted, the
   * item inherits the group's value.
   */
  required?: boolean;
}

/** A single checkbox inside a `CheckboxGroupRoot`. */
export const CheckboxGroupItem: Component<CheckboxGroupItemProps> = (props) => {
  const ctx = useCheckboxGroupContext();
  const [item, rest] = splitProps(props, ['value', 'disabled', 'required']);

  return (
    <Checkbox
      {...rest}
      {...bindMultiSelectItem(ctx, item)}
      size={ctx.size()}
      variant={ctx.variant()}
      color={ctx.color()}
    />
  );
};
