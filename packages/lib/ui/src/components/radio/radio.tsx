/**
 * Radio component.
 *
 * Ported from Radix UI Themes Radio. Renders a styled
 * `<input type="radio">` and is suitable on its own for custom layouts;
 * compose `RadioGroupRoot` + `RadioGroupItem` when you want the full
 * group UX (shared `name`, value-driven check state, native arrow-key
 * navigation, optional inline labels).
 *
 * Deviations from Radix:
 * - No `asChild` polymorphism — locks to `<input type="radio">`. Radix
 *   primitives ship a `<button role="radio">` variant; the native input
 *   gives us arrow-key navigation, form submission, and the ARIA contract
 *   for free.
 * - Controlled-only API. `defaultChecked` is dropped; pair `checked`
 *   with `onCheckedChange` and own the value at the call site.
 * - `color` accepts every semantic palette token (no hand-picked subset).
 * - Drops the `highContrast` prop. Recorded as a deferred deviation.
 * - No `radius` prop — radios are always circular per the design.
 *
 * @see https://www.radix-ui.com/themes/docs/components/radio-group
 * @see https://www.radix-ui.com/primitives/docs/components/radio-group
 */

import { mergeProps, splitProps } from 'solid-js';
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
import { callConsumerHandler } from '../compose-event-handler';
import * as css from './radio.css';

/** Visual size on a 1–3 scale. */
export type RadioSize = 1 | 2 | 3;
/** Visual treatment. */
export type RadioVariant = 'classic' | 'surface' | 'soft';
/** Semantic color palette for the checked indicator. */
export type RadioColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

/**
 * `Radio` props. Surfaces native `<input>` attributes apart from `type`
 * (forced to `'radio'`), the visual `size`/`color` props which collide
 * with our prop scheme, `defaultChecked` (controlled-only), and
 * `children` (the radio is a leaf control).
 */
export interface RadioProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'size' | 'color' | 'defaultChecked' | 'children'
    > {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: RadioSize;
  /** Visual treatment. @default 'surface' */
  variant?: RadioVariant;
  /** Semantic color palette for the checked indicator. @default 'accent' */
  color?: RadioColor;
  /** Controlled checked state. */
  checked: boolean;
  /**
   * Fires after the user activates the radio. Always called with
   * `true` — radios cannot be unchecked by the user, only superseded
   * by another radio in the same `name` group becoming checked.
   */
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Resolves the className stack shared by the standalone `Radio` and the
 * input rendered inside `RadioGroupItem`. Exposed so `RadioGroupItem`
 * can stamp its own input with the same variant treatment without
 * re-rendering an extra wrapper.
 */
export const resolveRadioClasses = (config: {
  size: RadioSize;
  variant: RadioVariant;
  color: RadioColor;
}): string => {
  return [
    css.root,
    css.size[config.size],
    css.color[config.color],
    css.variant[config.variant],
  ]
    .filter(Boolean)
    .join(' ');
};

/** Single styled `<input type="radio">`. */
const Radio: Component<RadioProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      color: 'accent' as const,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'color',
    'checked',
    'onCheckedChange',
    'class',
    'onChange',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const onChange: JSX.ChangeEventHandler<HTMLInputElement, Event> = (event) => {
    // Solid types `onChange` on `<input>` with `target: HTMLInputElement`
    // (narrower than the helper's `target: Element`). The cast widens
    // the handler back to the helper's signature; the runtime contract
    // is identical. Note: the change event on `<input>` is not
    // cancelable, so `preventDefault()` from a consumer handler is a
    // no-op — the controlled `checked` prop is the only way to suppress
    // the visual update.
    callConsumerHandler(
      local.onChange as JSX.EventHandlerUnion<HTMLInputElement, Event>,
      event,
    );
    local.onCheckedChange(true);
    // Re-sync after the consumer's handler. If the parent updated
    // state synchronously (typical Solid setSignal flow), `local.checked`
    // is now the new value and this is a no-op. If the parent ignored
    // the callback, this restores the input to match the prop so the
    // controlled contract holds.
    event.currentTarget.checked = local.checked;
  };

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      resolveRadioClasses({
        size: local.size,
        variant: local.variant,
        color: local.color,
      }),
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <input
      {...skeletonProps}
      type="radio"
      checked={local.checked}
      class={className()}
      data-testid={tid.testId}
      onChange={onChange}
    />
  );
};

export default Radio;
