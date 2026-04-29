/**
 * Skeleton component.
 *
 * Ported from Radix UI Themes Skeleton. Deviations:
 * - No Slot-based prop merging. The Skeleton always renders its own
 *   <span>; size standalone placeholders via `style={{ width, height }}`.
 * - Drops the `width`/`height` shorthand props — pass standard CSS
 *   values through `style` instead.
 * - The wrapper persists when `loading` is false. Margin, class, style,
 *   and test ids stay attached so toggling `loading` doesn't drop
 *   layout or test hooks.
 * - Pulse uses motion tokens (`slow[2]`) and respects
 *   `prefers-reduced-motion` automatically.
 *
 * @see https://www.radix-ui.com/themes/docs/components/skeleton
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './skeleton.css';

export interface SkeletonProps
  extends MarginProps, TestIdProps, JSX.HTMLAttributes<HTMLSpanElement> {
  /**
   * Render the placeholder when true; render children unchanged inside
   * the wrapper when false. @default true
   */
  loading?: boolean;
}

/**
 * Pulsing placeholder that mirrors the size of its children while their
 * data is loading. Toggle `loading` to swap between placeholder and
 * real content without changing the surrounding layout.
 */
const Skeleton: ParentComponent<SkeletonProps> = (rawProps) => {
  const props = mergeProps({ loading: true }, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'loading',
    'class',
    'children',
  ]);

  const className = () =>
    [...resolveMarginClasses(margin), local.loading && css.base, local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <span
      class={className()}
      data-testid={tid.testId}
      aria-hidden={local.loading || undefined}
      inert={local.loading || undefined}
      tabindex={local.loading ? -1 : undefined}
      {...rest}
    >
      {local.children}
    </span>
  );
};

export default Skeleton;
