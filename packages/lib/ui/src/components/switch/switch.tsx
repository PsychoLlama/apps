/**
 * Switch component.
 *
 * Ported from Radix UI Themes Switch and Radix UI Primitives Switch.
 * Deviations:
 * - No `color` prop. The "on" track always uses the configured `accent`.
 * - No `asChild` polymorphism — locks to `<button role="switch">`.
 * - No high-contrast variant.
 * - Form integration via a sibling `<input type="hidden">` rendered only
 *   when `name` is set and the switch is checked. Simpler than the React
 *   port's synthetic-bubble strategy and sufficient for native FormData.
 *   Consumers that observe form `change` events should listen to
 *   `onCheckedChange` on the Switch directly.
 *
 * @see https://www.radix-ui.com/themes/docs/components/switch
 * @see https://www.radix-ui.com/primitives/docs/components/switch
 */

import { createSignal, mergeProps, Show, splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { callConsumerHandler } from '../compose-event-handler';
import * as css from './switch.css';

/** Visual size on a 1–3 scale. */
export type SwitchSize = 1 | 2 | 3;
/** Visual treatment. */
export type SwitchVariant = 'classic' | 'surface' | 'soft';
/** Corner rounding. */
export type SwitchRadius = 'none' | 'small' | 'medium' | 'large' | 'full';

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
  /** Controlled checked state. Pair with `onCheckedChange`. */
  checked?: boolean;
  /** Initial checked state when uncontrolled. @default false */
  defaultChecked?: boolean;
  /** Fires after the user toggles the switch with the next state. */
  onCheckedChange?: (checked: boolean) => void;
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
      defaultChecked: false,
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
    'checked',
    'defaultChecked',
    'onCheckedChange',
    'value',
    'name',
    'class',
    'onClick',
  ]);

  const [internal, setInternal] = createSignal(local.defaultChecked);
  const isControlled = () => local.checked !== undefined;
  // Non-null assertion is sound: `isControlled()` only returns true when
  // `checked` is defined, and Solid re-evaluates on prop change.
  const checked = () => (isControlled() ? local.checked! : internal());

  const onClick: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (event) => {
    callConsumerHandler(local.onClick, event);
    if (event.defaultPrevented) return;
    const next = !checked();
    if (!isControlled()) setInternal(next);
    local.onCheckedChange?.(next);
  };

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.variant[local.variant],
      css.radiusVariant[local.radius],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <>
      <button
        {...rest}
        type="button"
        role="switch"
        aria-checked={checked()}
        class={className()}
        data-testid={tid.testId}
        onClick={onClick}
      >
        <span class={css.thumb} aria-hidden="true" />
      </button>
      <Show when={local.name && checked()}>
        <input type="hidden" name={local.name} value={local.value} />
      </Show>
    </>
  );
};

export default Switch;
