import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import * as css from './heading.css';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface HeadingProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  /** The heading level element to render. Choose based on document hierarchy. */
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Visual size on a 1–9 scale, independent of the heading level. @default 6 */
  size?: Size;
  /** Font weight. @default 'bold' */
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  /** Text alignment. */
  align?: 'left' | 'center' | 'right';
  /** Text color emphasis. High contrast for primary content, low for secondary. */
  color?: 'highContrast' | 'lowContrast';
}

/** Semantic heading with size independent of level. Pick the `as` level for document hierarchy and `size` for visual weight. */
const Heading: ParentComponent<HeadingProps> = (rawProps) => {
  const props = mergeProps(
    { size: 6 as Size, weight: 'bold' as const },
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
};

export default Heading;
