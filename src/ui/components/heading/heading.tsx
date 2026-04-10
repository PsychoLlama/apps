import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import type { TypeScale, FontWeight, TextColor } from '#design';
import {
  type HtmlHeadingTag,
  type PolymorphicProps,
} from '../../props/polymorphic';
import * as css from './heading.css';

/** Heading-specific props, independent of the rendered element. */
interface HeadingOwnProps {
  /** Visual size on a 1–9 scale, independent of the heading level. @default 6 */
  size?: TypeScale;
  /** Font weight. @default 'bold' */
  weight?: FontWeight;
  /** Text alignment. */
  align?: 'left' | 'center' | 'right';
  /** Text color emphasis. High contrast for primary content, low for secondary. */
  color?: TextColor;
}

/** Heading props for a specific heading level. */
export type HeadingProps<T extends HtmlHeadingTag> = PolymorphicProps<T> &
  HeadingOwnProps;

/** Semantic heading with size independent of level. Pick the `as` level for document hierarchy and `size` for visual weight. */
function Heading<const T extends HtmlHeadingTag>(
  props: HeadingProps<T>,
): JSX.Element;
function Heading(
  rawProps: { as: HtmlHeadingTag } & HeadingOwnProps &
    JSX.HTMLAttributes<HTMLHeadingElement>,
) {
  const props = mergeProps(
    { size: 6 as const, weight: 'bold' as const },
    rawProps,
  );
  const [local, rest] = splitProps(props, [
    'as',
    'size',
    'weight',
    'align',
    'color',
    'class',
    'children',
  ]);

  const className = () =>
    [
      css.base,
      css.size[local.size],
      css.weight[local.weight],
      local.align && css.align[local.align],
      local.color && css.color[local.color],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Dynamic component={local.as} class={className()} {...rest}>
      {local.children}
    </Dynamic>
  );
}

export default Heading;
