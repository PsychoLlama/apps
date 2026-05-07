/**
 * TextArea component.
 *
 * Ported from Radix UI Themes TextArea. Deviations:
 * - No `color` prop. `soft` styles against the configured `accent`.
 * - Locks to `<textarea>`. The wrapping `<div>` carries padding and
 *   the resize handle; the textarea itself has `resize: none`.
 *
 * @see https://www.radix-ui.com/themes/docs/components/text-area
 */

import { mergeProps, splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { type RequiredMobileInputProps } from '../../props/mobile-input';
import {
  type SkeletonProps,
  skeletonPropKeys,
  resolveSkeletonClass,
  resolveSkeletonAttrs,
} from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import * as css from './text-area.css';

/** Visual size on a 1–3 scale. */
export type TextAreaSize = 1 | 2 | 3;
/** Visual treatment. */
export type TextAreaVariant = 'classic' | 'surface' | 'soft';
/** Corner rounding. */
export type TextAreaRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
/** Resize handle behavior. */
export type TextAreaResize = 'none' | 'vertical' | 'horizontal' | 'both';

/**
 * `TextArea` props. Surfaces every native `<textarea>` attribute apart
 * from `color` (collides with our prop scheme) and `onPointerDown`
 * (overridden so it fires for clicks on the entire wrapper, not only
 * the inner textarea — call `event.preventDefault()` to suppress the
 * built-in focus delegation). Mobile-input attributes (`autocomplete`,
 * `autocapitalize`, `enterkeyhint`) are required via
 * `RequiredMobileInputProps` to force a conscious mobile-UX choice.
 * `enterkeyhint` is included even though Enter typically inserts a
 * newline — chat-style textareas legitimately want `'send'` — so
 * authors must pick or pass `undefined`.
 */
export interface TextAreaProps
  extends
    MarginProps,
    SkeletonProps,
    RequiredTestIdProps,
    RequiredMobileInputProps,
    Omit<
      JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
      | 'color'
      | 'onPointerDown'
      | 'autocomplete'
      | 'autocapitalize'
      | 'enterkeyhint'
    > {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: TextAreaSize;
  /** Visual treatment. @default 'surface' */
  variant?: TextAreaVariant;
  /** Corner rounding. @default 'medium' */
  radius?: TextAreaRadius;
  /**
   * Resize handle behavior. Defaults to `'none'` (matching Radix);
   * pass another value to opt back into a resize handle.
   * @default 'none'
   */
  resize?: TextAreaResize;
  /**
   * Fires for pointerdown anywhere on the wrapper (including the
   * padding around the textarea). Call `preventDefault()` to skip
   * the built-in click-to-focus delegation.
   */
  onPointerDown?: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent>;
}

/**
 * Multi-line text input. Renders a wrapping `<div>` plus an inner
 * `<textarea>`. The wrapper owns resize, so dragging the handle
 * reshapes the entire visual surface (including padding), matching
 * Radix.
 */
const TextArea: Component<TextAreaProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'surface' as const,
      radius: 'medium' as const,
      resize: 'none' as const,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'radius',
    'resize',
    'class',
    'onPointerDown',
    ...skeletonPropKeys,
  ]);

  // Padding lives on the wrapper so the resize handle reshapes the
  // entire surface — but `<div>` doesn't propagate click-to-focus the
  // way `<label for=>` does, so without delegation a click on the
  // padding would do nothing.
  const onPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = (
    event,
  ) => {
    if (typeof local.onPointerDown === 'function') local.onPointerDown(event);
    if (event.defaultPrevented) return;
    const textarea = event.currentTarget.querySelector('textarea');
    if (!textarea || textarea.disabled || textarea.readOnly) return;

    // Clicks on the textarea itself (or on intrinsically interactive
    // descendants, if a future iteration adds slots) keep their own
    // focus semantics.
    if (event.target.closest('textarea, input, button, a, select')) return;

    requestAnimationFrame(() => {
      if (textarea.contains(document.activeElement)) return;
      textarea.focus();
      const cursor = textarea.value.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.variant[local.variant],
      css.radiusVariant[local.radius],
      css.resize[local.resize],
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
      {/* Wrapper `inert` hides the textarea from the user, but the
       * textarea still submits, validates, and contributes to
       * FormData unless `disabled`. Force-disable while skeleton is
       * on so a loading field can't block submit on a `required`
       * rule or post placeholder text. */}
      <textarea
        {...rest}
        class={css.input}
        disabled={local.skeleton ? true : rest.disabled}
      />
    </div>
  );
};

export default TextArea;
