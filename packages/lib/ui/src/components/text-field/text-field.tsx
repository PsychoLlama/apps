/**
 * TextField component.
 *
 * Ported from Radix UI Themes TextField. Deviations:
 * - No `color` prop. `soft` styles against the configured `accent`,
 *   `surface`/`classic` against `neutral`.
 * - Slot subcomponent replaced by `left` / `right` props (single render
 *   path, simpler API; per-slot padding/gap overrides not exposed).
 * - Locks to `<input>`. Wrap in `<label>` / form for interactive context.
 *
 * @see https://www.radix-ui.com/themes/docs/components/text-field
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
  resolveSkeletonClass,
  resolveSkeletonAttrs,
} from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { callConsumerHandler } from '../compose-event-handler';
import * as css from './text-field.css';

/** Visual size on a 1–3 scale. */
export type TextFieldSize = 1 | 2 | 3;
/** Visual treatment. */
export type TextFieldVariant = 'classic' | 'surface' | 'soft';
/** Corner rounding. */
export type TextFieldRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
/**
 * `<input>` types TextField accepts. Excludes button-like types
 * (`submit`, `button`, `reset`, `image`) and non-text controls
 * (`checkbox`, `radio`, `color`, `file`, `range`, `hidden`) — those
 * have their own components or don't make sense as a text field.
 */
export type TextFieldType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'time'
  | 'week';

/**
 * `TextField` props. Surfaces every native `<input>` attribute apart
 * from the visual `size` and `color`, which collide with our props,
 * `type`, which is narrowed to text-input types only, and
 * `onPointerDown`, which is overridden so it fires for clicks on the
 * entire field surface (including slot padding) rather than only the
 * inner input — calling `event.preventDefault()` suppresses the
 * built-in focus delegation.
 */
export interface TextFieldProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'color' | 'type' | 'onPointerDown'
    > {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: TextFieldSize;
  /** Visual treatment. @default 'surface' */
  variant?: TextFieldVariant;
  /** Corner rounding. @default 'medium' */
  radius?: TextFieldRadius;
  /** `<input>` type. Narrowed to text-input types. @default 'text' */
  type?: TextFieldType;
  /** Content rendered before the input — typically an icon or prefix. */
  left?: JSX.Element;
  /** Content rendered after the input — typically an icon or action button. */
  right?: JSX.Element;
  /**
   * Fires for pointerdown on the field's entire visual surface
   * (wrapper, slot padding, input). Call `preventDefault()` to skip
   * the built-in click-to-focus delegation.
   */
  onPointerDown?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>;
}

/**
 * Single-line text input with optional inline content on either side.
 * Always renders a wrapping `<div>` plus an inner `<input>`. Clicking
 * empty space inside the wrapper focuses the input.
 */
const TextField: Component<TextFieldProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      radius: 'medium' as const,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'radius',
    'left',
    'right',
    'class',
    'onPointerDown',
    ...skeletonPropKeys,
  ]);

  // Clicks on the wrapper's empty space (slot padding, edges) need to
  // delegate to the input — `<div>` doesn't propagate click-to-focus
  // the way `<label for=>` does, and the wrapper isn't a label.
  const onPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (
    event,
  ) => {
    callConsumerHandler(local.onPointerDown, event);
    if (event.defaultPrevented) return;
    const input = event.currentTarget.querySelector('input');
    if (!input || input.disabled || input.readOnly) return;

    // Clicks on intrinsically interactive descendants get their own
    // focus semantics (e.g. a Button in the right slot). Don't hijack.
    if (event.target.closest('input, textarea, button, a, select')) return;

    const rect = input.getBoundingClientRect();
    const cursor =
      event.clientX < rect.left + rect.width / 2 ? 0 : input.value.length;

    requestAnimationFrame(() => {
      if (input.contains(document.activeElement)) return;
      input.focus();
      try {
        input.setSelectionRange(cursor, cursor);
      } catch {
        // Some input types (e.g. `email`, `number`) reject setSelectionRange.
      }
    });
  };

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.variant[local.variant],
      css.radiusVariant[local.radius],
      resolveSkeletonClass(local),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const wrapperAttrs = () => resolveSkeletonAttrs(local);

  return (
    <div
      class={className()}
      data-testid={tid.testId}
      onPointerDown={onPointerDown}
      {...wrapperAttrs()}
    >
      {local.left !== undefined && (
        <span class={`${css.slot} ${css.slotLeft}`}>{local.left}</span>
      )}
      <input {...rest} class={css.input} />
      {local.right !== undefined && (
        <span class={`${css.slot} ${css.slotRight}`}>{local.right}</span>
      )}
    </div>
  );
};

export default TextField;
