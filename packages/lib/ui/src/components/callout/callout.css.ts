/**
 * Callout styles.
 *
 * Ported from Radix UI Themes Callout. Deviations:
 * - Single component instead of compound Root/Icon/Text.
 * - Only accent and neutral colors (no full palette).
 */

import { style, styleVariants } from '@vanilla-extract/css';
import { accent, neutral, radius, space, typeScale } from '@lib/design';
import type { ColorPalette } from '@lib/design';

// --- Root ---

export const base = style({
  gridTemplateColumns: 'auto 1fr',
});

export const size = styleVariants({
  1: {
    gap: space[2],
    padding: space[3],
    borderRadius: radius[3],
  },
  2: {
    rowGap: space[2],
    columnGap: space[3],
    padding: space[4],
    borderRadius: radius[4],
  },
  3: {
    rowGap: space[3],
    columnGap: space[4],
    padding: space[5],
    borderRadius: radius[5],
  },
});

// --- Variant x Color matrix ---

const palettes = { accent, neutral } as const;
type ColorName = keyof typeof palettes;

const softStyle = (color: ColorName, highContrast: boolean) => {
  const palette: ColorPalette = palettes[color];
  return style({
    backgroundColor: palette.alpha[3],
    color: highContrast ? palette.solid[12] : palette.alpha[11],
  });
};

const surfaceStyle = (color: ColorName, highContrast: boolean) => {
  const palette: ColorPalette = palettes[color];
  return style({
    backgroundColor: palette.surface,
    boxShadow: `inset 0 0 0 1px ${palette.alpha[6]}`,
    color: highContrast ? palette.solid[12] : palette.alpha[11],
  });
};

const outlineStyle = (color: ColorName, highContrast: boolean) => {
  const palette: ColorPalette = palettes[color];
  return style({
    boxShadow: `inset 0 0 0 1px ${palette.alpha[7]}`,
    color: highContrast ? palette.solid[12] : palette.alpha[11],
  });
};

const buildContrast = (
  fn: (color: ColorName, highContrast: boolean) => string,
) => {
  return {
    accent: { normal: fn('accent', false), high: fn('accent', true) },
    neutral: { normal: fn('neutral', false), high: fn('neutral', true) },
  };
};

export const variantColor = {
  soft: buildContrast(softStyle),
  surface: buildContrast(surfaceStyle),
  outline: buildContrast(outlineStyle),
} as const;

// --- Icon container ---

export const iconSize = styleVariants({
  1: { height: typeScale[2].lineHeight },
  2: { height: typeScale[2].lineHeight },
  3: { height: typeScale[3].lineHeight },
});
