/**
 * Callout styles.
 *
 * Ported from Radix UI Themes Callout. Deviations:
 * - Single component instead of compound Root/Icon/Text.
 * - Only accent and neutral colors (no full palette).
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  accentAlpha,
  neutral,
  neutralAlpha,
  radius,
  space,
  typeScale,
} from '#design';

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

const colors = {
  accent: { alpha: accentAlpha, solid: accent },
  neutral: { alpha: neutralAlpha, solid: neutral },
} as const;
type ColorName = keyof typeof colors;

function softStyle(color: ColorName, highContrast: boolean) {
  const { alpha, solid } = colors[color];
  return style({
    backgroundColor: alpha[3],
    color: highContrast ? solid[12] : alpha[11],
  });
}

function surfaceStyle(color: ColorName, highContrast: boolean) {
  const { alpha, solid } = colors[color];
  return style({
    backgroundColor: alpha[2],
    boxShadow: `inset 0 0 0 1px ${alpha[6]}`,
    color: highContrast ? solid[12] : alpha[11],
  });
}

function outlineStyle(color: ColorName, highContrast: boolean) {
  const { alpha, solid } = colors[color];
  return style({
    boxShadow: `inset 0 0 0 1px ${alpha[7]}`,
    color: highContrast ? solid[12] : alpha[11],
  });
}

function buildContrast(
  fn: (color: ColorName, highContrast: boolean) => string,
) {
  return {
    accent: { normal: fn('accent', false), high: fn('accent', true) },
    neutral: { normal: fn('neutral', false), high: fn('neutral', true) },
  };
}

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
