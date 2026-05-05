import { style, styleVariants } from '@vanilla-extract/css';
import { radius, space } from '@lib/design';
import { lightDark } from '@lib/design/color-scheme';
import { blueDark, blueLight } from '@lib/design/color/blue';
import { brownDark, brownLight } from '@lib/design/color/brown';
import { cyanDark, cyanLight } from '@lib/design/color/cyan';
import { indigoDark, indigoLight } from '@lib/design/color/indigo';
import { irisDark, irisLight } from '@lib/design/color/iris';
import { jadeDark, jadeLight } from '@lib/design/color/jade';
import { orangeDark, orangeLight } from '@lib/design/color/orange';
import { pinkDark, pinkLight } from '@lib/design/color/pink';
import { plumDark, plumLight } from '@lib/design/color/plum';
import { purpleDark, purpleLight } from '@lib/design/color/purple';
import { skyDark, skyLight } from '@lib/design/color/sky';
import { tealDark, tealLight } from '@lib/design/color/teal';
import { violetDark, violetLight } from '@lib/design/color/violet';

/**
 * Wrap items as a flex row so each card sizes to its content rather
 * than stretching across a grid track.
 */
export const root = style({
  display: 'flex',
  flexWrap: 'wrap',
});

/**
 * Base for theme-tinted radio cards. Paints a circular swatch via a
 * `::before` pseudo so the visible card stays a single element — no
 * extra DOM nodes inside the `<label>`. Overrides the upstream
 * `justify-content: center` so the swatch sits before the label.
 */
export const swatchBase = style({
  justifyContent: 'flex-start',
  selectors: {
    '&::before': {
      content: '""',
      width: space[4],
      height: space[4],
      borderRadius: radius.full,
      flexShrink: 0,
    },
  },
});

/**
 * Per-theme background color for the `::before` swatch. Pull `9` (the
 * Radix solid accent) directly from each palette's raw scale —
 * compile-time only, so unselected themes don't leak into the runtime
 * bundle.
 */
export const swatchTint = styleVariants({
  blue: {
    selectors: {
      '&::before': { backgroundColor: lightDark(blueLight[9], blueDark[9]) },
    },
  },
  brown: {
    selectors: {
      '&::before': { backgroundColor: lightDark(brownLight[9], brownDark[9]) },
    },
  },
  cyan: {
    selectors: {
      '&::before': { backgroundColor: lightDark(cyanLight[9], cyanDark[9]) },
    },
  },
  indigo: {
    selectors: {
      '&::before': {
        backgroundColor: lightDark(indigoLight[9], indigoDark[9]),
      },
    },
  },
  iris: {
    selectors: {
      '&::before': { backgroundColor: lightDark(irisLight[9], irisDark[9]) },
    },
  },
  jade: {
    selectors: {
      '&::before': { backgroundColor: lightDark(jadeLight[9], jadeDark[9]) },
    },
  },
  orange: {
    selectors: {
      '&::before': {
        backgroundColor: lightDark(orangeLight[9], orangeDark[9]),
      },
    },
  },
  pink: {
    selectors: {
      '&::before': { backgroundColor: lightDark(pinkLight[9], pinkDark[9]) },
    },
  },
  plum: {
    selectors: {
      '&::before': { backgroundColor: lightDark(plumLight[9], plumDark[9]) },
    },
  },
  purple: {
    selectors: {
      '&::before': {
        backgroundColor: lightDark(purpleLight[9], purpleDark[9]),
      },
    },
  },
  sky: {
    selectors: {
      '&::before': { backgroundColor: lightDark(skyLight[9], skyDark[9]) },
    },
  },
  teal: {
    selectors: {
      '&::before': { backgroundColor: lightDark(tealLight[9], tealDark[9]) },
    },
  },
  violet: {
    selectors: {
      '&::before': {
        backgroundColor: lightDark(violetLight[9], violetDark[9]),
      },
    },
  },
});
