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
): (string | false | undefined)[] => {
  const ghost = variant === 'ghost';
  return [
    css.base,
    css.size[size],
    ghost ? css.buttonGhostSize[size] : css.buttonNonGhostSize[size],
    !ghost && css.buttonNonGhostSvg,
    css.variantColor[variant][color],
    css.variantDisabled[variant],
    radius && css.cornerRadius[radius],
  ];
};

export const resolveIconButtonStyleClasses = (
  size: ButtonSize,
  variant: ButtonVariant,
  color: ButtonColor,
  radius?: ButtonRadius,
): (string | false | undefined)[] => {
  const ghost = variant === 'ghost';
  return [
    css.base,
    css.size[size],
    ghost ? css.iconButtonGhostSize[size] : css.iconButtonNonGhostSize[size],
    css.variantColor[variant][color],
    css.variantDisabled[variant],
    radius && css.cornerRadius[radius],
  ];
};
