/**
 * Skeleton component.
 *
 * Ported from Radix UI Themes Skeleton. Deviations:
 * - Polymorphic via `as` (default `'span'`). Pick a block tag (e.g.
 *   `'div'`) when wrapping block-level children — Radix's React build
 *   sidesteps this with Slot-based prop merging, which we don't have.
 * - The wrapper persists when `loading` is false. Margin, class, style,
 *   and test ids stay attached so toggling `loading` doesn't drop
 *   layout or test hooks.
 * - Drops the `width`/`height` shorthand props — pass standard CSS
 *   values through `style` instead.
 * - Pulse uses motion tokens (`slow[2]`) and respects
 *   `prefers-reduced-motion` automatically.
 *
 * @see https://www.radix-ui.com/themes/docs/components/skeleton
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  type HtmlBoxTag,
  type PolymorphicProps,
} from '../../props/polymorphic';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './skeleton.css';

/** Tags Skeleton may render as. Default is `'span'`. */
export type SkeletonTag = 'span' | HtmlBoxTag;

interface SkeletonOwnProps {
  /**
   * Render the placeholder when true; render children unchanged inside
   * the wrapper when false. @default true
   */
  loading?: boolean;
}

/** Skeleton props for a specific element tag. */
export type SkeletonProps<T extends SkeletonTag = 'span'> = PolymorphicProps<
  T,
  SkeletonOwnProps & MarginProps & TestIdProps
>;

/**
 * Pulsing placeholder that mirrors the size of its children while their
 * data is loading. Toggle `loading` to swap between placeholder and
 * real content without changing the surrounding layout.
 */
function Skeleton<const T extends SkeletonTag = 'span'>(
  props: SkeletonProps<T>,
): JSX.Element;
function Skeleton(
  rawProps: { as?: SkeletonTag } & SkeletonOwnProps &
    MarginProps &
    TestIdProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
  const props = mergeProps({ as: 'span' as const, loading: true }, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'as',
    'loading',
    'class',
    'children',
  ]);

  const className = () =>
    [...resolveMarginClasses(margin), local.loading && css.base, local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <Dynamic
      component={local.as}
      class={className()}
      data-testid={tid.testId}
      aria-hidden={local.loading || undefined}
      inert={local.loading || undefined}
      tabindex={local.loading ? -1 : undefined}
      {...rest}
    >
      {local.children}
    </Dynamic>
  );
}

export default Skeleton;
