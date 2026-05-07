/**
 * ScrollArea component.
 *
 * Native-CSS port of Radix UI Themes ScrollArea. The viewport is a
 * single element styled with `overflow: auto` (or `scroll`) plus
 * `::-webkit-scrollbar` and `scrollbar-color` rules. No JavaScript
 * scrollbar machinery.
 *
 * Trade-offs vs upstream:
 * - `type` covers `'auto'`, `'always'`, and `'hover'`. Upstream's
 *   `'scroll'` mode (show during scroll, fade after a delay) still
 *   needs JS — there's no CSS-only "user is actively scrolling"
 *   signal. Recorded as deferred.
 * - No `scrollHideDelay`. The user agent owns fade timing; on
 *   `'hover'`, the fade duration is the design system's standard
 *   transition.
 *
 * @see https://www.radix-ui.com/themes/docs/components/scroll-area
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
import * as css from './scroll-area.css';

/** Scrollbar visibility mode. */
export type ScrollAreaType = 'auto' | 'always' | 'hover';
/** Visual size on a 1–3 scale. */
export type ScrollAreaSize = 1 | 2 | 3;
/** Which axes can scroll. */
export type ScrollAreaScrollbars = 'vertical' | 'horizontal' | 'both';

/** ScrollArea-specific props, independent of the target element. */
interface ScrollAreaOwnProps {
  /**
   * When the scrollbar is rendered. `'auto'` shows it only when
   * content overflows; `'always'` reserves it permanently;
   * `'hover'` keeps it transparent until the user hovers or focuses
   * the viewport. @default 'auto'
   */
  type?: ScrollAreaType;
  /** Visual size on a 1–3 scale. @default 1 */
  size?: ScrollAreaSize;
  /** Which axes can scroll. @default 'both' */
  scrollbars?: ScrollAreaScrollbars;
}

/** ScrollArea props for a specific element tag. */
export type ScrollAreaProps<T extends HtmlBoxTag> = PolymorphicProps<
  T,
  ScrollAreaOwnProps & MarginProps & TestIdProps
>;

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
function ScrollArea<const T extends HtmlBoxTag>(
  props: ScrollAreaProps<T>,
): JSX.Element;
function ScrollArea(
  rawProps: { as: HtmlBoxTag } & ScrollAreaOwnProps &
    MarginProps &
    TestIdProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
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
    'as',
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
      local.type === 'hover' && css.revealOnHover,
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Dynamic
      component={local.as}
      {...rest}
      class={className()}
      data-testid={tid.testId}
    >
      {local.children}
    </Dynamic>
  );
}

export default ScrollArea;
