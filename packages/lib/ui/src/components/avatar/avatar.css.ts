/**
 * Avatar styles.
 *
 * Ported from Radix UI Themes Avatar. Deviations:
 * - Sizes collapse from 1–9 to 1–3, riding the local space scale.
 * - `radius` is a per-component class switch, not a `data-radius` cascade.
 * - Color is restricted to the five semantic palettes.
 * - Drops the `high-contrast` variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/avatar
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
  type SpaceScale,
  type TypeScale,
} from '@lib/design';

// --- Root ---

export const root = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  verticalAlign: 'middle',
  flexShrink: 0,
  fontFamily: fontFamily.body,
  fontWeight: fontWeight.medium,
  textTransform: 'uppercase',
  overflow: 'hidden',
});

// --- Image ---

export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 'inherit',
});

// --- Fallback ---
//
// Sized to fill the root so the variant background stays edge-to-edge,
// even when the fallback content is just a single character.

export const fallback = style({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'inherit',
});

// --- Sizes ---
//
// Font sizing rides the type scale and inherits from the root, so the
// fallback letterforms scale alongside the avatar diameter.

const sizeStep = (side: SpaceScale, step: TypeScale) => ({
  width: space[side],
  height: space[side],
  fontSize: typeScale[step].fontSize,
  letterSpacing: typeScale[step].letterSpacing,
});

export const size = styleVariants({
  1: sizeStep(5, 2),
  2: sizeStep(6, 3),
  3: sizeStep(7, 4),
});

// --- Radius ---

export const cornerRadius = styleVariants({
  // Reset zeroes border-radius; `none` is the cascade default.
  none: {},
  small: { borderRadius: radius[1] },
  medium: { borderRadius: radius[2] },
  large: { borderRadius: radius[3] },
  full: { borderRadius: radius.full },
});

// --- Variant x Color matrix ---
//
// Variants paint the fallback only — once the image loads it covers the
// surface and the variant style stops mattering. Applied directly to
// the fallback element (not via descendant selectors on the root) so
// each style targets its own leaf class, matching VE's contract.

const palettes = { accent, neutral, danger, warning, success } as const;
type ColorName = keyof typeof palettes;

const solidStyle = (color: ColorName) => {
  const palette = palettes[color];
  return style({
    backgroundColor: palette.solid[9],
    color: palette.contrast,
  });
};

const softStyle = (color: ColorName) => {
  const palette = palettes[color];
  return style({
    backgroundColor: palette.alpha[3],
    color: palette.alpha[11],
  });
};

const buildColors = (fn: (color: ColorName) => string) => ({
  accent: fn('accent'),
  neutral: fn('neutral'),
  danger: fn('danger'),
  warning: fn('warning'),
  success: fn('success'),
});

export const variantColor = {
  solid: buildColors(solidStyle),
  soft: buildColors(softStyle),
} as const;
