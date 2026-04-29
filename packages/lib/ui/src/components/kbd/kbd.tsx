/**
 * Kbd component.
 *
 * Ported from Radix UI Themes Kbd. Deviations:
 * - No `asChild`. Renders an inert `<kbd>`. Wrap in `<a>` / `<button>`
 *   for interactive use; the embossed press effect requires polymorphism
 *   and is unavailable here.
 *
 * @see https://www.radix-ui.com/themes/docs/components/kbd
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import type { TypeScale } from '@lib/design';
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
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './kbd.css';

type Variant = 'classic' | 'soft';

export interface KbdProps
  extends
    MarginProps,
    SkeletonProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLElement> {
  /** Visual size on a 1–9 scale. Falls back to 0.75× the parent font-size when omitted. */
  size?: TypeScale;
  /** Visual treatment. @default 'classic' */
  variant?: Variant;
}

/** Inline keyboard input — typically a single key or chord. */
const Kbd: ParentComponent<KbdProps> = (rawProps) => {
  const props = mergeProps({ variant: 'classic' as const }, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'variant',
    'class',
    'children',
    ...skeletonPropKeys,
  ]);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      css.variant[local.variant],
      local.size && css.size[local.size],
      resolveSkeletonClass(local),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const merged = mergeProps(rest, () => resolveSkeletonAttrs(local));

  return (
    <kbd class={className()} data-testid={tid.testId} {...merged}>
      {local.children}
    </kbd>
  );
};

export default Kbd;
