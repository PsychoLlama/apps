import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import {
  boxPropKeys,
  resolveBoxClasses,
  type BoxBaseProps,
} from '../../props/box';
import {
  flexPropKeys,
  resolveFlexClasses,
  type FlexProps as FlexOwnProps,
} from '../../props/flex';
import {
  type HtmlBoxTag,
  type PolymorphicProps,
} from '../../props/polymorphic';
import {
  resolveSkeletonClass,
  resolveSkeletonAttrs,
} from '../../props/skeleton';

/** Flex props for a specific element tag. */
export type FlexProps<T extends HtmlBoxTag> = PolymorphicProps<
  T,
  FlexOwnProps & BoxBaseProps
>;

/** Flexbox layout container with direction, alignment, wrapping, and gap controls. */
function Flex<const T extends HtmlBoxTag>(props: FlexProps<T>): JSX.Element;
function Flex(
  props: { as: HtmlBoxTag } & FlexOwnProps &
    BoxBaseProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
  const [local, boxAndRest] = splitProps(props, flexPropKeys);
  const [box, rest] = splitProps(boxAndRest, boxPropKeys);

  const className = () =>
    [
      ...resolveBoxClasses(box),
      ...resolveFlexClasses(local),
      resolveSkeletonClass(box),
      box.class,
    ]
      .filter(Boolean)
      .join(' ');

  const merged = mergeProps(rest, () => resolveSkeletonAttrs(box));

  return (
    <Dynamic
      component={box.as}
      class={className()}
      data-testid={box.testId}
      {...merged}
    >
      {box.children}
    </Dynamic>
  );
}

export default Flex;
