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
 * `TextField` props. Surfaces every native `<input>` attribute apart
 * from the visual `size` and `color`, which collide with our props,
 * and `onPointerDown`, which is overridden so it fires for clicks on
 * the entire field surface (including slot padding) rather than only
 * the inner input — calling `event.preventDefault()` suppresses the
 * built-in focus delegation.
 */
export interface TextFieldProps
  extends
    MarginProps,
    RequiredTestIdProps,
    Omit<
      JSX.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'color' | 'onPointerDown'
    > {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: TextFieldSize;
  /** Visual treatment. @default 'surface' */
  variant?: TextFieldVariant;
  /** Corner rounding. @default 'medium' */
  radius?: TextFieldRadius;
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
    'ref',
    'onPointerDown',
  ]);

  let inputEl: HTMLInputElement | undefined;

  const setInputRef = (el: HTMLInputElement) => {
    inputEl = el;
    const consumerRef = local.ref;
    if (typeof consumerRef === 'function') consumerRef(el);
  };

  // Clicks on the wrapper's empty space (slot padding, edges) need to
  // delegate to the input — `<div>` doesn't propagate click-to-focus
  // the way `<label for=>` does, and the wrapper isn't a label.
  const onPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (
    event,
  ) => {
    callConsumerHandler(local.onPointerDown, event);
    if (event.defaultPrevented) return;
    const input = inputEl;
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
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div
      class={className()}
      data-testid={tid.testId}
      onPointerDown={onPointerDown}
    >
      {local.left !== undefined && (
        <span class={`${css.slot} ${css.slotLeft}`}>{local.left}</span>
      )}
      <input {...rest} ref={(el) => setInputRef(el)} class={css.input} />
      {local.right !== undefined && (
        <span class={`${css.slot} ${css.slotRight}`}>{local.right}</span>
      )}
    </div>
  );
};

export default TextField;
