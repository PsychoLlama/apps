import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import {
  type HtmlTextTag,
  type PolymorphicProps,
} from '../../props/polymorphic';
import * as css from './text.css';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Text-specific props, independent of the rendered element. */
interface TextOwnProps {
  /** Visual size on a 1–9 scale. @default 3 */
  size?: Size;
  /** Font weight. */
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  /** Text alignment. */
  align?: 'left' | 'center' | 'right';
  /** Text color emphasis. High contrast for primary content, low for secondary. */
  color?: 'highContrast' | 'lowContrast';
}

/** Text props for a specific element tag. */
export type TextProps<T extends HtmlTextTag> = PolymorphicProps<T> &
  TextOwnProps;

/** General-purpose text component for body copy, labels, and inline text. */
function Text<const T extends HtmlTextTag>(props: TextProps<T>): JSX.Element;
function Text(
  rawProps: { as: HtmlTextTag } & TextOwnProps &
    JSX.HTMLAttributes<HTMLElement>,
) {
  const props = mergeProps({ size: 3 as Size }, rawProps);
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
      local.weight && css.weight[local.weight],
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

export default Text;
