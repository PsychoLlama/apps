import type { ArgTypes } from 'storybook-solidjs-vite';
import * as css from './button.css';

export type ButtonSize = 1 | 2 | 3 | 4;
export type ButtonVariant = 'solid' | 'soft' | 'surface' | 'outline' | 'ghost';
export type ButtonColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';
export type ButtonRadius = 'none' | 'small' | 'medium' | 'large' | 'full';

export interface ButtonStyleProps {
  /** Visual size on a 1-4 scale. @default 2 */
  size?: ButtonSize;
  /** Visual treatment. @default 'solid' */
  variant?: ButtonVariant;
  /** Semantic color. @default 'accent' */
  color?: ButtonColor;
  /** Corner radius override. Defaults to a size-based radius. */
  radius?: ButtonRadius;
}

export const buttonStylePropKeys = [
  'size',
  'variant',
  'color',
  'radius',
] as const;

export const buttonStyleDefaults = {
  size: 2 as const,
  variant: 'solid' as const,
  color: 'accent' as const,
} satisfies Omit<Required<ButtonStyleProps>, 'radius'>;

export const resolveButtonStyleClasses = (
  size: ButtonSize,
  variant: ButtonVariant,
  color: ButtonColor,
  radius?: ButtonRadius,
): (string | undefined)[] => {
  return [
    css.base,
    css.size[size],
    css.variantColor[variant][color],
    radius && css.cornerRadius[radius],
  ];
};

export const resolveIconButtonStyleClasses = (
  size: ButtonSize,
  variant: ButtonVariant,
  color: ButtonColor,
  radius?: ButtonRadius,
): (string | undefined)[] => {
  return [
    css.base,
    css.iconSize[size],
    css.variantColor[variant][color],
    radius && css.cornerRadius[radius],
  ];
};

export const buttonStyleArgTypes: ArgTypes<ButtonStyleProps> = {
  size: {
    control: { type: 'range', min: 1, max: 4, step: 1 },
  },
  variant: {
    control: 'inline-radio',
    options: ['solid', 'soft', 'surface', 'outline', 'ghost'],
  },
  color: {
    control: 'inline-radio',
    options: ['accent', 'neutral', 'danger', 'warning', 'success'],
  },
  radius: {
    control: 'inline-radio',
    options: ['none', 'small', 'medium', 'large', 'full'],
  },
};
