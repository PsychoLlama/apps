/**
 * Strong component.
 *
 * Ported from Radix UI Themes Strong. Deviations:
 * - No `asChild`. Tag-locked to `<strong>`.
 * - No `truncate` prop. Truncation is a no-op on inline hosts; promote
 *   the parent block to truncate.
 * - No font-style / font-family / font-weight theming knobs. We ship a
 *   single body font, so the upstream font-size-adjust trick (and the
 *   nested-strong font-size guard) is moot.
 *
 * @see https://www.radix-ui.com/themes/docs/components/strong
 */

import { splitProps } from 'solid-js';
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
import {
  type WrapProps,
  wrapPropKeys,
  resolveWrapClass,
} from '../../props/wrap';
import * as css from './strong.css';

export interface StrongProps
  extends
    MarginProps,
    WrapProps,
    SkeletonProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLElement> {}

/** Strongly-emphasized inline text. Renders a `<strong>`. */
const Strong: ParentComponent<StrongProps> = (rawProps) => {
  const [margin, withoutMargin] = splitProps(rawProps, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'class',
    'children',
    ...wrapPropKeys,
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      resolveWrapClass(local),
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <strong class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </strong>
  );
};

export default Strong;
