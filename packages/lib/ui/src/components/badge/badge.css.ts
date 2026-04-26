/**
 * Badge styles.
 *
 * Ported from Radix UI Themes Badge. Deviations:
 * - `radius` is a per-component class switch, not a `data-radius` cascade.
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  danger,
  fontFamily,
  fontWeight,
  neutral,
  radius,
  space,
  success,
  typeScale,
  warning,
} from '@lib/design';

// --- Root ---

export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  fontFamily: fontFamily.body,
  fontWeight: fontWeight.medium,
  whiteSpace: 'nowrap',
});

// --- Sizes ---

const typeScaleProps = (step: 1 | 2) => ({
  fontSize: typeScale[step].fontSize,
  lineHeight: typeScale[step].lineHeight,
  letterSpacing: typeScale[step].letterSpacing,
});

export const size = styleVariants({
  1: {
    ...typeScaleProps(1),
    paddingInline: space[2],
    gap: space[1],
  },
  2: {
    ...typeScaleProps(1),
    paddingBlock: space[1],
    paddingInline: space[2],
    gap: space[1],
  },
  3: {
    ...typeScaleProps(2),
    paddingBlock: space[1],
    paddingInline: space[3],
    gap: space[2],
  },
});

// --- Radius ---

export const cornerRadius = styleVariants({
  // Reset already zeroes border-radius; `none` is the cascade default.
  none: {},
  small: { borderRadius: radius[1] },
  medium: { borderRadius: radius[2] },
  large: { borderRadius: radius[3] },
  full: { borderRadius: radius.full },
});

// --- Variant x Color matrix ---

const palettes = { accent, neutral, danger, warning, success } as const;
type ColorName = keyof typeof palettes;

const solidStyle = (color: ColorName, highContrast: boolean) => {
  const palette = palettes[color];
  if (highContrast) {
    return style({
      backgroundColor: palette.solid[12],
      color: palette.solid[1],
    });
  }
  return style({
    backgroundColor: palette.solid[9],
    color: palette.contrast,
  });
};

const softStyle = (color: ColorName, highContrast: boolean) => {
  const palette = palettes[color];
  return style({
    backgroundColor: palette.alpha[3],
    color: highContrast ? palette.solid[12] : palette.alpha[11],
  });
};

const surfaceStyle = (color: ColorName, highContrast: boolean) => {
  const palette = palettes[color];
  return style({
    backgroundColor: palette.surface,
    boxShadow: `inset 0 0 0 1px ${palette.alpha[6]}`,
    color: highContrast ? palette.solid[12] : palette.alpha[11],
  });
};

const outlineStyle = (color: ColorName, highContrast: boolean) => {
  const palette = palettes[color];
  return style({
    boxShadow: `inset 0 0 0 1px ${palette.alpha[7]}`,
    color: highContrast ? palette.solid[12] : palette.alpha[11],
  });
};

const buildContrast = (
  fn: (color: ColorName, highContrast: boolean) => string,
) => ({
  accent: { normal: fn('accent', false), high: fn('accent', true) },
  neutral: { normal: fn('neutral', false), high: fn('neutral', true) },
  danger: { normal: fn('danger', false), high: fn('danger', true) },
  warning: { normal: fn('warning', false), high: fn('warning', true) },
  success: { normal: fn('success', false), high: fn('success', true) },
});

export const variantColor = {
  solid: buildContrast(solidStyle),
  soft: buildContrast(softStyle),
  surface: buildContrast(surfaceStyle),
  outline: buildContrast(outlineStyle),
} as const;
