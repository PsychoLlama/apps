/**
 * Em component.
 *
 * Ported from Radix UI Themes Em. Deviations:
 * - No `asChild`. Tag-locked to `<em>`.
 * - No `truncate` prop. Truncation is a no-op on inline hosts; promote
 *   the parent block to truncate.
 * - No font-style / font-family / font-weight theming knobs. We ship a
 *   single body font and a fixed italic treatment, so the upstream
 *   font-size-adjust trick (and the nested-em font-size guard) is moot.
 *
 * @see https://www.radix-ui.com/themes/docs/components/em
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
import * as css from './em.css';

export interface EmProps
  extends
    MarginProps,
    WrapProps,
    SkeletonProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLElement> {}

/** Stress-emphasized inline text. Renders an `<em>`. */
const Em: ParentComponent<EmProps> = (rawProps) => {
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
    <em class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </em>
  );
};

export default Em;
