/**
 * Inset component.
 *
 * Ported from Radix UI Themes Inset. Place inside a `<Card>` to bleed
 * content (typically media) past the card's padding to its edges.
 *
 * @see https://www.radix-ui.com/themes/docs/components/inset
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
import {
  type SkeletonProps,
  skeletonPropKeys,
  resolveSkeletonClass,
  resolveSkeletonAttrs,
} from '../../props/skeleton';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import * as css from './inset.css';

type InsetSide = 'all' | 'x' | 'y' | 'top' | 'bottom' | 'left' | 'right';
type InsetClip = 'border-box' | 'padding-box';

/** Inset-specific layout props, independent of the target element. */
interface InsetOwnProps {
  /** Which sides to break out of. @default 'all' */
  side?: InsetSide;
  /** Overflow clipping region. @default 'border-box' */
  clip?: InsetClip;
  /**
   * Reserve the parent card's padding on the sides that aren't bled,
   * so following content keeps its rhythm. Set false for media that
   * should flow flush into the next element. @default true
   */
  pad?: boolean;
}

/** Inset props for a specific element tag. */
export type InsetProps<T extends HtmlBoxTag> = PolymorphicProps<
  T,
  InsetOwnProps & MarginProps & SkeletonProps & TestIdProps
>;

/** Bleeds content past the parent Card's padding to its edges. */
function Inset<const T extends HtmlBoxTag>(props: InsetProps<T>): JSX.Element;
function Inset(
  rawProps: { as: HtmlBoxTag } & InsetOwnProps &
    MarginProps &
    SkeletonProps &
    TestIdProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
  const props = mergeProps(
    { side: 'all' as const, clip: 'border-box' as const, pad: true },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'as',
    'side',
    'clip',
    'pad',
    'class',
    'children',
    ...skeletonPropKeys,
  ]);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      css.side[local.side],
      css.clip[local.clip],
      local.pad === false && css.padOff,
      resolveSkeletonClass(local),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  const merged = mergeProps(rest, () => resolveSkeletonAttrs(local));

  return (
    <Dynamic
      component={local.as}
      class={className()}
      data-testid={tid.testId}
      {...merged}
    >
      {local.children}
    </Dynamic>
  );
}

export default Inset;
