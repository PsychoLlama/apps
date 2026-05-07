/**
 * Badge component.
 *
 * Ported from Radix UI Themes Badge. Deviations:
 * - Color is restricted to our five semantic palettes instead of 26 accents.
 * - `radius` is a per-component class switch, not a `data-radius` cascade.
 * - No `asChild`. Wrap the badge in `<a>` / `<button>` for interactive use.
 *
 * @see https://www.radix-ui.com/themes/docs/components/badge
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
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
import * as css from './badge.css';

type Size = 1 | 2 | 3;
type Variant = 'solid' | 'soft' | 'surface' | 'outline';
type Color = 'accent' | 'neutral' | 'danger' | 'warning' | 'success';
type Radius = 'none' | 'small' | 'medium' | 'large' | 'full';

export interface BadgeProps
  extends
    MarginProps,
    SkeletonProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLSpanElement> {
  /** Visual size on a 1–3 scale. @default 1 */
  size?: Size;
  /** Visual treatment. @default 'soft' */
  variant?: Variant;
  /** Semantic color. @default 'accent' */
  color?: Color;
  /**
   * Corner rounding. When unset, sizes pick a sensible default
   * (size-1 → 3px, sizes 2–3 → 4px) — mirroring Radix's Badge under
   * its default `Theme.radius='medium'`. Pass `'full'` for pill-shaped.
   */
  radius?: Radius;
  /** High-contrast text for stronger emphasis. @default false */
  highContrast?: boolean;
}

/** Compact label or status indicator. Inline; pill-shaped by default. */
const Badge: ParentComponent<BadgeProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 1 as const,
      variant: 'soft' as const,
      color: 'accent' as const,
      highContrast: false,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'color',
    'radius',
    'highContrast',
    'class',
    'children',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const contrast = () => (local.highContrast ? 'high' : 'normal');

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      css.size[local.size],
      local.radius && css.cornerRadius[local.radius],
      css.variantColor[local.variant][local.color][contrast()],
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <span class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </span>
  );
};

export default Badge;
