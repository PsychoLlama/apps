/**
 * Switch component.
 *
 * Ported from Radix UI Themes Switch and Radix UI Primitives Switch.
 * Deviations:
 * - No `asChild` polymorphism — locks to `<button role="switch">`.
 * - Controlled-only API. Radix's `defaultChecked` opt-in to uncontrolled
 *   state is dropped: pair `checked` with `onCheckedChange` and own the
 *   value at the call site. Form-reset semantics belong to the parent.
 * - Form integration via a sibling `<input type="hidden">` rendered
 *   only when `name` is set, the switch is checked, and the button is
 *   enabled — disabled controls are excluded from FormData like native
 *   checkboxes. The hidden input mirrors the button's `form="..."`
 *   attribute so an externally-associated switch still submits its
 *   value. Simpler than the React port's synthetic-bubble strategy;
 *   consumers that watch the form's own `change` event should listen
 *   to `onCheckedChange` directly.
 *
 * @see https://www.radix-ui.com/themes/docs/components/switch
 * @see https://www.radix-ui.com/primitives/docs/components/switch
 */

import { mergeProps, Show, splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import * as css from './switch.css';

/** Visual size on a 1–3 scale. */
export type SwitchSize = 1 | 2 | 3;
/** Visual treatment. */
export type SwitchVariant = 'classic' | 'surface' | 'soft';
/** Corner rounding. */
export type SwitchRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
/** Semantic color palette for the checked track. */
export type SwitchColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

/**
 * `Switch` props. Surfaces native `<button>` attributes apart from
 * `type` (forced to `'button'`), `role` and `aria-checked` (set
 * internally), `value` (overloaded to mean the form-submit value when
 * checked), and the visual `size`/`color` props which collide with our
 * prop scheme. `children` is omitted — the thumb is the only child.
 */
export interface SwitchProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<
      JSX.ButtonHTMLAttributes<HTMLButtonElement>,
      'type' | 'role' | 'size' | 'color' | 'value' | 'children'
    > {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: SwitchSize;
  /** Visual treatment. @default 'surface' */
  variant?: SwitchVariant;
  /** Corner rounding. @default 'full' */
  radius?: SwitchRadius;
  /** Semantic color palette for the checked track. @default 'accent' */
  color?: SwitchColor;
  /**
   * Marks the switch as required for assistive technology. Surfaces as
   * `aria-required="true"` on the button. Native HTML5 form validation
   * isn't enforced — the hidden input is `type="hidden"` and doesn't
   * participate in client-side validation; gate the form submit yourself.
   * @default false
   */
  required?: boolean;
  /** Controlled checked state. */
  checked: boolean;
  /** Fires after the user toggles the switch with the next state. */
  onCheckedChange: (checked: boolean) => void;
  /**
   * Value submitted with the form when checked. When unchecked, the
   * field is omitted from FormData entirely (matches `<input
   * type="checkbox">` semantics).
   * @default 'on'
   */
  value?: string;
}

/**
 * Two-state toggle. Renders a `<button role="switch">` with a sliding
 * thumb. Pair with `name` for native form submission — when checked,
 * a hidden `<input>` carries `value` (default `'on'`) into FormData.
 */
const Switch: Component<SwitchProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      radius: 'full' as const,
      color: 'accent' as const,
      value: 'on',
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'radius',
    'color',
    'required',
    'checked',
    'onCheckedChange',
    'value',
    'name',
    'disabled',
    'form',
    'class',
    'onClick',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const onClick: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (event) => {
    if (typeof local.onClick === 'function') local.onClick(event);
    if (event.defaultPrevented) return;
    local.onCheckedChange(!local.checked);
  };

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.color[local.color],
      css.variant[local.variant],
      css.radiusVariant[local.radius],
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <>
      <button
        {...skeletonProps}
        type="button"
        role="switch"
        aria-checked={local.checked}
        aria-required={local.required ? true : undefined}
        class={className()}
        data-testid={tid.testId}
        disabled={local.disabled}
        form={local.form}
        onClick={onClick}
      >
        <span class={css.thumb} aria-hidden="true" />
      </button>
      {/* The button is `inert` while skeleton, but the hidden mirror
       * sits outside the button and would still post into FormData.
       * Suppress it so a loading switch can't carry stale data. */}
      <Show
        when={local.name && local.checked && !local.disabled && !local.skeleton}
      >
        <input
          type="hidden"
          name={local.name}
          value={local.value}
          form={local.form}
        />
      </Show>
    </>
  );
};

export default Switch;
