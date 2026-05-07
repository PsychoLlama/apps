/**
 * ScrollArea component.
 *
 * Native-CSS port of Radix UI Themes ScrollArea. The viewport is a
 * single `<div>` styled with `overflow: auto` (or `scroll`) plus
 * `::-webkit-scrollbar` and `scrollbar-color` rules. No JavaScript
 * scrollbar machinery.
 *
 * Trade-offs vs upstream:
 * - `type` is restricted to `'auto'` and `'always'`. Upstream's
 *   `'scroll'` (show on scroll, fade) and `'hover'` (show on hover)
 *   modes require JS-driven fade timers and are recorded as deferred.
 * - No `scrollHideDelay`. The user agent owns fade timing.
 * - Tag-locked to `<div>`. Wrap a different tag if you need one.
 *
 * @see https://www.radix-ui.com/themes/docs/components/scroll-area
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './scroll-area.css';

/** Scrollbar visibility mode. */
export type ScrollAreaType = 'auto' | 'always';
/** Visual size on a 1–3 scale. */
export type ScrollAreaSize = 1 | 2 | 3;
/** Which axes can scroll. */
export type ScrollAreaScrollbars = 'vertical' | 'horizontal' | 'both';

export interface ScrollAreaProps
  extends MarginProps, TestIdProps, JSX.HTMLAttributes<HTMLDivElement> {
  /**
   * When the scrollbar is rendered. `'auto'` shows it only when content
   * overflows; `'always'` reserves it permanently. @default 'auto'
   */
  type?: ScrollAreaType;
  /** Visual size on a 1–3 scale. @default 1 */
  size?: ScrollAreaSize;
  /** Which axes can scroll. @default 'both' */
  scrollbars?: ScrollAreaScrollbars;
}

type Overflow = 'auto' | 'scroll' | 'hidden';

const resolveOverflow = (
  axis: 'x' | 'y',
  scrollbars: ScrollAreaScrollbars,
  type: ScrollAreaType,
): Overflow => {
  const allowed =
    scrollbars === 'both' ||
    (axis === 'x' && scrollbars === 'horizontal') ||
    (axis === 'y' && scrollbars === 'vertical');
  if (!allowed) return 'hidden';
  return type === 'always' ? 'scroll' : 'auto';
};

/**
 * Constrains content to a fixed footprint with native, styled
 * scrollbars. Use as a drop-in scroll container around long lists,
 * code blocks, or wide tables.
 */
const ScrollArea: ParentComponent<ScrollAreaProps> = (rawProps) => {
  const props = mergeProps(
    {
      type: 'auto' as const,
      size: 1 as const,
      scrollbars: 'both' as const,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'type',
    'size',
    'scrollbars',
    'class',
    'children',
  ]);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.root,
      css.size[local.size],
      css.overflowX[resolveOverflow('x', local.scrollbars, local.type)],
      css.overflowY[resolveOverflow('y', local.scrollbars, local.type)],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div {...rest} class={className()} data-testid={tid.testId}>
      {local.children}
    </div>
  );
};

export default ScrollArea;
