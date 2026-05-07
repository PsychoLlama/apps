/**
 * Badge styles.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/badge.css
 *
 * Deviations:
 * - `radius` is a per-component class switch, not a `data-radius` cascade.
 *   The default is size-aware (size-1 → 3px, sizes 2–3 → 4px), baked
 *   into the size variants — mirrors Radix's `max(radius-N, radius-full)`
 *   under its default `Theme.radius='medium'`. Explicit `radius` values
 *   flatten that per-token (size-3 + `radius='small'` is 3px here, vs
 *   4px upstream).
 * - Sub-token padding/gap (Radix uses `space-1 * 0.5`, `space-1 * 1.5`,
 *   `space-2 * 1.25`) is preserved via `calc()` because our space scale
 *   has no half-step entries.
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
  fontStyle: 'normal',
  whiteSpace: 'nowrap',
  // Keep the badge from stretching to fill a flex/grid row.
  height: 'fit-content',
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
    paddingBlock: `calc(${space[1]} * 0.5)`,
    paddingInline: `calc(${space[1]} * 1.5)`,
    gap: `calc(${space[1]} * 1.5)`,
    borderRadius: radius[1],
  },
  2: {
    ...typeScaleProps(1),
    paddingBlock: space[1],
    paddingInline: space[2],
    gap: `calc(${space[1]} * 1.5)`,
    borderRadius: radius[2],
  },
  3: {
    ...typeScaleProps(2),
    paddingBlock: space[1],
    paddingInline: `calc(${space[2]} * 1.25)`,
    gap: space[2],
    borderRadius: radius[2],
  },
});

// --- Radius ---

// Declared after `size` so the explicit override wins via source order.
export const cornerRadius = styleVariants({
  // eslint-disable-next-line custom/require-design-tokens -- intentional zero radius; Radix exposes "none" as a theme-level preset, not a token in the scale.
  none: { borderRadius: 0 },
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
      selectors: {
        '&::selection': {
          backgroundColor: palette.alpha[11],
          color: palette.solid[1],
        },
      },
    });
  }
  return style({
    backgroundColor: palette.solid[9],
    color: palette.contrast,
    selectors: {
      '&::selection': {
        backgroundColor: palette.solid[7],
        color: palette.solid[12],
      },
    },
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
  if (highContrast) {
    return style({
      // Stack an accent-tinted ring with a neutral ring, matching Radix's
      // `var(--accent-a7), var(--gray-a11)` pair.
      boxShadow: [
        `inset 0 0 0 1px ${palette.alpha[7]}`,
        `inset 0 0 0 1px ${neutral.alpha[11]}`,
      ].join(', '),
      color: palette.solid[12],
    });
  }
  return style({
    boxShadow: `inset 0 0 0 1px ${palette.alpha[8]}`,
    color: palette.alpha[11],
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
