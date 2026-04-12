/**
 * Link styles.
 *
 * Ported from Radix UI Themes Link. Deviations:
 * - Only accent and neutral colors (no full palette).
 * - No `color-mix()` progressive enhancement.
 * - Vanilla Extract instead of plain CSS.
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  accentAlpha,
  fontFamily,
  fontWeight,
  neutral,
  neutralAlpha,
  radius,
  typeScale,
} from '#design';

// --- Base ---

export const base = style({
  fontFamily: fontFamily.body,
  cursor: 'pointer',
  textDecorationLine: 'none',
  textDecorationStyle: 'solid',
  textDecorationThickness: 'min(2px, max(1px, 0.05em))',
  textUnderlineOffset: 'calc(0.025em + 2px)',

  ':focus-visible': {
    borderRadius: radius[1],
    outline: `2px solid ${accent[8]}`,
    outlineOffset: '2px',
    textDecorationLine: 'none',
  },
});

// --- Size ---

const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const size = styleVariants(
  Object.fromEntries(
    steps.map((step) => [
      step,
      {
        fontSize: typeScale[step].fontSize,
        lineHeight: typeScale[step].lineHeight,
        letterSpacing: typeScale[step].letterSpacing,
      },
    ]),
  ) as Record<
    (typeof steps)[number],
    { fontSize: string; lineHeight: string; letterSpacing: string }
  >,
);

// --- Weight ---

export const weight = styleVariants({
  light: { fontWeight: fontWeight.light },
  regular: { fontWeight: fontWeight.regular },
  medium: { fontWeight: fontWeight.medium },
  bold: { fontWeight: fontWeight.bold },
});

// --- Color x Contrast ---

type ColorName = 'accent' | 'neutral';

const colorScales = {
  accent: { solid: accent, alpha: accentAlpha },
  neutral: { solid: neutral, alpha: neutralAlpha },
} as const;

function colorStyle(color: ColorName, highContrast: boolean) {
  const { solid, alpha } = colorScales[color];
  return style({
    color: highContrast ? solid[12] : solid[11],
    textDecorationColor: highContrast ? alpha[6] : alpha[5],
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

export const color = buildContrast(colorStyle);

// --- Underline ---

const hoverUnderline = {
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:hover': {
          textDecorationLine: 'underline' as const,
        },
      },
    },
  },
};

export const underline = styleVariants({
  auto: hoverUnderline,
  hover: hoverUnderline,
  always: { textDecorationLine: 'underline' },
  none: { textDecorationLine: 'none' },
});

/**
 * Applied when `underline === 'auto'` and the link is high-contrast or
 * neutral-colored. Makes the underline always visible for affordance.
 */
export const underlineAutoAlways = style({
  textDecorationLine: 'underline',
});
