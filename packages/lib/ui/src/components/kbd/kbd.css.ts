/**
 * Kbd styles.
 *
 * Ported from Radix UI Themes Kbd. The embossed keycap shadow has
 * structurally different layers per color scheme — different inset
 * directions and reflection layers — so it's switched via
 * `assignColorSchemeVars` rather than `light-dark()`.
 *
 * Geometry is em-based: padding, radius, and shadow scale with the
 * computed font size.
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  black,
  fontFamily,
  fontWeight,
  neutral,
  typeScale,
  white,
} from '@lib/design';
import { assignColorSchemeVars } from '@lib/design/color-scheme';

const kbdBoxShadow = createVar();

assignColorSchemeVars(
  {
    [kbdBoxShadow]: [
      `inset 0 -0.05em 0.5em ${neutral.alpha[2]}`,
      `inset 0 0.05em ${white.step12}`,
      `inset 0 0.25em 0.5em ${neutral.alpha[2]}`,
      `inset 0 -0.05em ${neutral.alpha[6]}`,
      `0 0 0 0.05em ${neutral.alpha[5]}`,
      `0 0.08em 0.17em ${neutral.alpha[7]}`,
    ].join(', '),
  },
  {
    [kbdBoxShadow]: [
      `inset 0 -0.05em 0.5em ${neutral.alpha[3]}`,
      `inset 0 0.05em ${neutral.alpha[11]}`,
      `inset 0 0.25em 0.5em ${neutral.alpha[2]}`,
      `inset 0 -0.1em ${black.step11}`,
      `0 0 0 0.075em ${neutral.alpha[7]}`,
      `0 0.08em 0.17em ${black.step12}`,
    ].join(', '),
  },
);

// Em-based geometry. The keycap is sized relative to surrounding text so
// it tracks any parent font-size — the design-token escape hatch the
// shadow and radius docs call out for inline kbd.
/* eslint-disable custom/require-design-tokens */
export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,

  fontFamily: fontFamily.body,
  fontWeight: fontWeight.regular,
  verticalAlign: 'text-top',
  whiteSpace: 'nowrap',

  // Lifts the keycap so its baseline aligns with surrounding text.
  position: 'relative',
  top: '-0.03em',

  fontSize: '0.75em',
  minWidth: '1.75em',
  lineHeight: '1.7em',
  boxSizing: 'border-box',
  paddingLeft: '0.5em',
  paddingRight: '0.5em',
  paddingBottom: '0.05em',
  wordSpacing: '-0.1em',
  borderRadius: '0.35em',

  // Don't stretch in flex/grid parents.
  height: 'fit-content',

  color: neutral.solid[12],
});
/* eslint-enable custom/require-design-tokens */

export const variant = styleVariants({
  classic: {
    backgroundColor: neutral.solid[1],
    boxShadow: kbdBoxShadow,
  },
  soft: {
    backgroundColor: neutral.alpha[3],
  },
});

const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const size = styleVariants(
  Object.fromEntries(
    steps.map((step) => [
      step,
      {
        fontSize: `calc(${typeScale[step].fontSize} * 0.8)`,
        letterSpacing: typeScale[step].letterSpacing,
      },
    ]),
  ) as Record<
    (typeof steps)[number],
    { fontSize: string; letterSpacing: string }
  >,
);
