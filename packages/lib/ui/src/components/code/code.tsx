/**
 * Code component.
 *
 * Ported from Radix UI Themes Code. Deviations:
 * - No `asChild`. Tag-locked to `<code>`. Wrap in `<a>` / `<button>` for
 *   interactive use; the upstream `:hover` recolor lives on those
 *   wrappers and is not reproduced here.
 * - Color is restricted to our five semantic palettes instead of 26
 *   accents.
 * - No `highContrast` prop. Recorded for follow-up; soft/outline already
 *   use the high-contrast text rail.
 *
 * @see https://www.radix-ui.com/themes/docs/components/code
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
import * as css from './code.css';

type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
type Color = 'accent' | 'neutral' | 'danger' | 'warning' | 'success';

export interface CodeProps
  extends
    MarginProps,
    TruncateProps,
    WrapProps,
    SkeletonProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLElement> {
  /** Visual size on a 1–9 scale. Inherits font-size from the parent when omitted. */
  size?: TypeScale;
  /** Visual treatment. @default 'soft' */
  variant?: Variant;
  /** Semantic color. @default 'accent' */
  color?: Color;
  /** Font weight. */
  weight?: FontWeight;
}

/** Inline monospace snippet — names, identifiers, short literals. */
const Code: ParentComponent<CodeProps> = (rawProps) => {
  const props = mergeProps(
    { variant: 'soft' as const, color: 'accent' as const },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'color',
    'weight',
    'class',
    'children',
    ...truncatePropKeys,
    ...wrapPropKeys,
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      local.size && css.size[local.size],
      css.variantColor[local.variant][local.color],
      local.weight && css.weight[local.weight],
      !local.truncate && resolveWrapClass(local),
      resolveTruncateClass(local),
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <code class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </code>
  );
};

export default Code;
