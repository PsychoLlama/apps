/**
 * Blockquote component.
 *
 * Ported from Radix UI Themes Blockquote. Deviations:
 * - No `asChild`. Tag-locked to `<blockquote>` — semantic and not
 *   substitutable.
 * - Color is restricted to our five semantic palettes instead of 26
 *   accents, and only paints the leading rail (the upstream cascade
 *   tints both rail and text). Wrap a `<Text>` inside if you also
 *   want to recolor the body copy.
 * - No `highContrast` prop. Recorded for follow-up.
 *
 * @see https://www.radix-ui.com/themes/docs/components/blockquote
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import type { FontWeight, TypeScale } from '@lib/design';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  type RequiredSelectableProps,
  selectablePropKeys,
  resolveSelectableClass,
} from '../../props/selectable';
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import {
  type TruncateProps,
  truncatePropKeys,
  resolveTruncateClass,
} from '../../props/truncate';
import {
  type WrapProps,
  wrapPropKeys,
  resolveWrapClass,
} from '../../props/wrap';
import * as css from './blockquote.css';

type Color = 'accent' | 'neutral' | 'danger' | 'warning' | 'success';

export interface BlockquoteProps
  extends
    MarginProps,
    TruncateProps,
    WrapProps,
    RequiredSelectableProps,
    SkeletonProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLQuoteElement> {
  /** Visual size on a 1–9 scale. Inherits from the parent when omitted. */
  size?: TypeScale;
  /** Font weight. */
  weight?: FontWeight;
  /** Semantic color for the leading rail. @default 'accent' */
  color?: Color;
}

/** Block-level quotation set off by a colored leading rail. */
const Blockquote: ParentComponent<BlockquoteProps> = (rawProps) => {
  const props = mergeProps({ color: 'accent' as const }, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'weight',
    'color',
    'class',
    'children',
    ...truncatePropKeys,
    ...wrapPropKeys,
    ...selectablePropKeys,
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      local.size && css.size[local.size],
      local.weight && css.weight[local.weight],
      css.color[local.color],
      !local.truncate && resolveWrapClass(local),
      resolveTruncateClass(local),
      resolveSelectableClass(local),
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <blockquote class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </blockquote>
  );
};

export default Blockquote;
