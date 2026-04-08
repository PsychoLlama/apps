import { splitProps, mergeProps, type JSX } from 'solid-js';
import { button } from './button.css';

type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
type Size = 1 | 2 | 3;

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button(props: ButtonProps) {
  const merged = mergeProps({ variant: 'solid' as Variant, size: 2 as Size }, props);
  const [local, rest] = splitProps(merged, ['variant', 'size', 'class', 'children']);

  return (
    <button
      class={`${button({ variant: local.variant, size: local.size })}${local.class ? ` ${local.class}` : ''}`}
      {...rest}
    >
      {local.children}
    </button>
  );
}
