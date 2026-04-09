import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import * as css from './button.css';

type Size = 1 | 2 | 3 | 4;
type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
type Color = 'accent' | 'neutral' | 'danger';

export interface ButtonProps
  extends MarginProps,
    JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual size on a 1-4 scale. @default 2 */
  size?: Size;
  /** Visual treatment. @default 'solid' */
  variant?: Variant;
  /** Semantic color. @default 'accent' */
  color?: Color;
}

/** Interactive button for triggering actions. */
const Button: ParentComponent<ButtonProps> = (rawProps) => {
  const props = mergeProps(
    { size: 2 as Size, variant: 'solid' as Variant, color: 'accent' as Color },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [local, rest] = splitProps(withoutMargin, [
    'size',
    'variant',
    'color',
    'class',
    'children',
  ]);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      css.size[local.size],
      css.variantColor[local.variant][local.color],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <button class={className()} {...rest}>
      {local.children}
    </button>
  );
};

export default Button;
