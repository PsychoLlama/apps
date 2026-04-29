/**
 * Card component.
 *
 * Ported from Radix UI Themes Card. Polymorphic via `as`; widens
 * `HtmlBoxTag` with the interactive text tags `a` and `label` so cards
 * can serve as the click target. Pairs with `<Inset>` for content that
 * breaks out of the card's padding.
 *
 * @see https://www.radix-ui.com/themes/docs/components/card
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
import * as css from './card.css';

type CardSize = 1 | 2 | 3 | 4 | 5;
type CardVariant = 'surface' | 'classic' | 'ghost';

/** Tags Card may render as. */
export type CardTag = HtmlBoxTag | 'a' | 'button' | 'label';

/** Card-specific layout props, independent of the target element. */
interface CardOwnProps {
  /** Visual size on a 1–5 scale. @default 1 */
  size?: CardSize;
  /** Visual treatment. @default 'surface' */
  variant?: CardVariant;
}

/** Card props for a specific element tag. */
export type CardProps<T extends CardTag> = PolymorphicProps<
  T,
  CardOwnProps & MarginProps & SkeletonProps & TestIdProps
>;

const interactiveTags = new Set<CardTag>(['a', 'button', 'label']);

/** Surface container with consistent padding, border, and elevation. */
function Card<const T extends CardTag>(props: CardProps<T>): JSX.Element;
function Card(
  rawProps: { as: CardTag } & CardOwnProps &
    MarginProps &
    SkeletonProps &
    TestIdProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
  const props = mergeProps(
    { size: 1 as const, variant: 'surface' as const },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'as',
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
      css.size[local.size],
      css.variant[local.variant],
      interactiveTags.has(local.as) && css.interactive,
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

export default Card;
