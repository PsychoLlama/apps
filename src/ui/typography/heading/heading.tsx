import { Dynamic } from 'solid-js/web';
import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import * as css from './heading.css';

type Size = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface HeadingProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: Size;
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  align?: 'left' | 'center' | 'right';
  color?: 'highContrast' | 'lowContrast';
}

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
