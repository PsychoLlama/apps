/**
 * Container component.
 *
 * Ported from Radix UI Themes Container. Caps a column of content at a
 * fixed max-width and aligns it within the available space. Pair with
 * `<Section>` for vertical rhythm.
 *
 * Deviations:
 * - Polymorphic via `as` (Radix is `<div>` + `asChild`).
 * - `align` values are `start | center | end` (Radix: `left | center | right`).
 * - No responsive object props or `display` prop.
 *
 * @see https://www.radix-ui.com/themes/docs/components/container
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  boxPropKeys,
  resolveBoxClasses,
  type BoxBaseProps,
} from '../../props/box';
import { type PolymorphicProps } from '../../props/polymorphic';
import { useSkeleton } from '../../props/skeleton';
import * as css from './container.css';

type ContainerSize = 1 | 2 | 3 | 4;
type ContainerAlign = 'start' | 'center' | 'end';

/**
 * Tags Container may render as. Limited to flow-content containers
 * because the component always wraps children in an inner `<div>` —
 * `as="ul"`/`"table"`/`"tr"` would produce invalid DOM.
 */
export type ContainerTag =
  | 'div'
  | 'main'
  | 'article'
  | 'section'
  | 'aside'
  | 'header'
  | 'footer'
  | 'nav'
  | 'figure';

/** Container-specific layout props, independent of the target element. */
interface ContainerOwnProps {
  /** Max-width preset for the inner column. @default 4 */
  size?: ContainerSize;
  /** Horizontal alignment of the inner column within the container. @default 'center' */
  align?: ContainerAlign;
}

/** Container props for a specific element tag. */
export type ContainerProps<T extends ContainerTag> = PolymorphicProps<
  T,
  ContainerOwnProps & BoxBaseProps
>;

const containerOwnPropKeys = ['size', 'align'] as const;

/** Caps content width at a fixed max and aligns the column horizontally. */
function Container<const T extends ContainerTag>(
  props: ContainerProps<T>,
): JSX.Element;
function Container(
  rawProps: { as: ContainerTag } & ContainerOwnProps &
    BoxBaseProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
  const props = mergeProps(
    { size: 4 as const, align: 'center' as const },
    rawProps,
  );
  const [local, boxAndRest] = splitProps(props, containerOwnPropKeys);
  const [box, rest] = splitProps(boxAndRest, boxPropKeys);
  const [skeletonClass, skeletonProps] = useSkeleton(box, rest);

  const className = () =>
    [
      ...resolveBoxClasses(box),
      css.base,
      css.align[local.align],
      skeletonClass(),
      box.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Dynamic
      component={box.as}
      class={className()}
      data-testid={box.testId}
      {...skeletonProps}
    >
      <div class={`${css.inner} ${css.size[local.size]}`}>{box.children}</div>
    </Dynamic>
  );
}

export default Container;
