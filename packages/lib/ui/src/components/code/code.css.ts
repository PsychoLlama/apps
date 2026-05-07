/**
 * Code styles.
 *
 * Ported from Radix UI Themes Code. Deviations:
 * - No `--code-font-size-adjust` correction. Radix nudges monospace down
 *   ~5–10% to match the surrounding sans x-height; we ship a single
 *   monospace stack and accept its native metrics.
 * - No `highContrast` variant. Soft/outline already use alpha[11] which
 *   is the high-contrast text rail; the `12` step is reserved for a
 *   separate prop we haven't shipped.
 * - Padding and border-radius are em-based (mirrors Radix) so the chip
 *   scales with size. Radius drops upstream's `var(--radius-factor)`
 *   multiplier — Radius scaling is a Theme-level knob we don't expose.
 * - No interactive hover states. We don't render Code as a link or
 *   button; consumers wrap with `<Link>` / `<button>` for that, and the
 *   `:hover` color shift would belong on the wrapper anyway.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/code.css
 */

import { fallbackVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  danger,
  fontFamily,
  fontWeight,
  letterSpacingOffset,
  neutral,
  success,
  typeScale,
  warning,
} from '@lib/design';
import { lineHeight, letterSpacing } from '../../vars/typography.css';

// Em-based geometry. The chip sizes relative to surrounding text so a
// `<Code>` inside a `<Text size={5}>` automatically grows. Tokens like
// `radius`/`space` are step-based and would lose that linkage.
/* eslint-disable custom/require-design-tokens */
export const base = style({
  fontFamily: fontFamily.code,
  // No `font-weight` default — let Code inherit weight from the
  // surrounding text so `<Code>` inside `<Strong>` reads bold without
  // an explicit `weight` prop. Mirrors upstream `--code-font-weight: inherit`.
  // `line-height` reads the sized-ancestor's metric (set by Text/Heading)
  // and falls back to a tight 1.25 when no Text wraps it. Per-size
  // variants below override the var locally.
  lineHeight: fallbackVar(lineHeight, '1.25'),
  // Compose a monospace tightening with the surrounding tracking so a
  // `<Code>` inside `<Text size={7}>` lands at
  // `letterSpacingOffset.code + typeScale[7].letterSpacing`. Mirrors
  // Radix's `calc(var(--code-letter-spacing) + var(--letter-spacing))`.
  letterSpacing: `calc(${letterSpacingOffset.code} + ${fallbackVar(letterSpacing, '0em')})`,
  paddingBlock: '0.1em',
  paddingInline: '0.25em',
  borderRadius: 'calc(0.5px + 0.2em)',

  // Don't stretch in flex/grid parents.
  height: 'fit-content',
  // Repaint the box across line breaks (Radix uses `box-decoration-break`
  // for the same effect on its `:hover` highlight; we keep it on by
  // default so wrapped `<Code>` stays visually contiguous).
  boxDecorationBreak: 'clone',
});
/* eslint-enable custom/require-design-tokens */

const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

// Per-size variants set the shared typography vars locally; the base
// rule's `lineHeight` / `letterSpacing` calc reads them. fontSize is
// painted directly because it's not vendored as a shared var.
export const size = styleVariants(
  Object.fromEntries(
    steps.map((step) => [
      step,
      {
        fontSize: typeScale[step].fontSize,
        vars: {
          [lineHeight]: typeScale[step].lineHeight,
          [letterSpacing]: typeScale[step].letterSpacing,
        },
      },
    ]),
  ) as Record<
    (typeof steps)[number],
    { fontSize: string; vars: Record<string, string> }
  >,
);

// --- Variant x Color matrix ---

const palettes = { accent, neutral, danger, warning, success } as const;
type ColorName = keyof typeof palettes;

const solidStyle = (color: ColorName) => {
  const palette = palettes[color];
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

const softStyle = (color: ColorName) =>
  style({
    backgroundColor: palettes[color].alpha[3],
    color: palettes[color].alpha[11],
  });

const outlineStyle = (color: ColorName) =>
  style({
    boxShadow: `inset 0 0 0 max(1px, 0.033em) ${palettes[color].alpha[8]}`,
    color: palettes[color].alpha[11],
  });

// Ghost is padding-less and transparent; only the text color flips.
// The zero overrides reset the base rule's em-based padding — we can't
// rely on the global reset here because the base style already painted
// over it.
const ghostStyle = (color: ColorName) =>
  style({
    // eslint-disable-next-line custom/require-design-tokens -- explicit reset of base padding for the ghost variant
    paddingBlock: 0,
    // eslint-disable-next-line custom/require-design-tokens -- explicit reset of base padding for the ghost variant
    paddingInline: 0,
    color: palettes[color].alpha[11],
  });

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
  outline: buildColors(outlineStyle),
  ghost: buildColors(ghostStyle),
} as const;

export const weight = styleVariants({
  light: { fontWeight: fontWeight.light },
  regular: { fontWeight: fontWeight.regular },
  medium: { fontWeight: fontWeight.medium },
  bold: { fontWeight: fontWeight.bold },
});
