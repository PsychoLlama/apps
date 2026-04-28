/**
 * TextArea component.
 *
 * Ported from Radix UI Themes TextArea. Deviations:
 * - No `color` prop. `soft` styles against the configured `accent`.
 * - Locks to `<textarea>`. The wrapping `<div>` carries the resize
 *   handle; the textarea itself has `resize: none`.
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
 * from `color`, which collides with our prop scheme.
 */
export interface TextAreaProps
  extends
    MarginProps,
    RequiredTestIdProps,
    Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'color'> {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: TextAreaSize;
  /** Visual treatment. @default 'surface' */
  variant?: TextAreaVariant;
  /** Corner rounding. @default 'medium' */
  radius?: TextAreaRadius;
  /** Resize handle behavior. Omit to honor the user agent default. */
  resize?: TextAreaResize;
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
  ]);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.variant[local.variant],
      css.radiusVariant[local.radius],
      local.resize && css.resize[local.resize],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div class={className()} data-testid={tid.testId}>
      <textarea {...rest} class={css.input} />
    </div>
  );
};

export default TextArea;
