/**
 * Blockquote styles.
 *
 * Ported from Radix UI Themes Blockquote. Deviations:
 * - No `--quote-font-*` theming knobs. Type is plain body font, sized
 *   via the standard 1–9 scale.
 * - `color` is a per-component palette switch — accent / neutral /
 *   danger / warning / success — instead of a `data-accent-color`
 *   cascade reading whichever Theme is mounted above. The border tint
 *   resolves to `palette.alpha[6]` of the chosen color; text content
 *   keeps its inherited color so the body copy doesn't shift hue with
 *   the rail.
 * - No `highContrast` variant. Recorded for follow-up.
 * - The italic upstream `<q>` flavor is intentionally absent on
 *   `<blockquote>` — block quotes are body copy, not pull-quotes.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/blockquote.css
 */

import { fallbackVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  danger,
  fontFamily,
  fontWeight,
  neutral,
  space,
  success,
  typeScale,
  warning,
} from '@lib/design';
import { lineHeight, letterSpacing } from '../../vars/typography.css';

// Mirror upstream's `max(space-1, 0.25em)` rail and
// `min(space-5, max(space-3, 0.5em))` indent — em-based so the chrome
// stays proportional inside oversized type, with token caps for small
// type. The border tint is supplied by the per-color rule below.
export const base = style({
  fontFamily: fontFamily.body,
  lineHeight: fallbackVar(lineHeight, 'inherit'),
  letterSpacing: fallbackVar(letterSpacing, 'inherit'),
  borderInlineStartStyle: 'solid',
  borderInlineStartWidth: `max(${space[1]}, 0.25em)`,
  paddingInlineStart: `min(${space[5]}, max(${space[3]}, 0.5em))`,
});

const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

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

export const weight = styleVariants({
  light: { fontWeight: fontWeight.light },
  regular: { fontWeight: fontWeight.regular },
  medium: { fontWeight: fontWeight.medium },
  bold: { fontWeight: fontWeight.bold },
});

const palettes = { accent, neutral, danger, warning, success } as const;
type ColorName = keyof typeof palettes;

export const color = styleVariants(
  Object.fromEntries(
    (['accent', 'neutral', 'danger', 'warning', 'success'] as const).map(
      (name) => [name, { borderInlineStartColor: palettes[name].alpha[6] }],
    ),
  ) as Record<ColorName, { borderInlineStartColor: string }>,
);
