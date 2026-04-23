/**
 * Card styles.
 *
 * Ported from Radix UI Themes Card. Deviations:
 * - Single-element render (no `::before`/`::after`); we use `inset box-shadow`
 *   for the border and rely on `panelTranslucent` tokens for translucent fills.
 * - Neutral only (no color scales).
 * - Interactive states are gated by an `interactive` class set by the
 *   component when `as` is `'a' | 'button' | 'label'`, instead of selecting
 *   on those element names.
 *
 * @see https://www.radix-ui.com/themes/docs/components/card
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  background,
  fast,
  neutralAlpha,
  radius,
  type RadiusScale,
  shadow,
  space,
  type SpaceScale,
  standard,
} from '@lib/design';
import {
  cardBorderRadius,
  cardPaddingBottom,
  cardPaddingLeft,
  cardPaddingRight,
  cardPaddingTop,
} from './card.vars.css';

// --- Root ---

export const base = style({
  position: 'relative',
  display: 'block',
  paddingTop: cardPaddingTop,
  paddingRight: cardPaddingRight,
  paddingBottom: cardPaddingBottom,
  paddingLeft: cardPaddingLeft,
  borderRadius: cardBorderRadius,
  transitionProperty: 'background-color, box-shadow',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
});

/** Applied by the component when `as` is an interactive tag. */
export const interactive = style({
  selectors: {
    '&:not(:disabled)': {
      cursor: 'pointer',
    },
    '&:not(:disabled):focus-visible': {
      outline: `2px solid ${accent[8]}`,
      outlineOffset: '2px',
    },
  },
});

// --- Size ---

const sizeStyle = (pad: SpaceScale, rad: RadiusScale) => ({
  vars: {
    [cardPaddingTop]: space[pad],
    [cardPaddingRight]: space[pad],
    [cardPaddingBottom]: space[pad],
    [cardPaddingLeft]: space[pad],
    [cardBorderRadius]: radius[rad],
  },
});

export const size = styleVariants({
  1: sizeStyle(3, 4),
  2: sizeStyle(4, 4),
  3: sizeStyle(5, 5),
  4: sizeStyle(6, 5),
  5: sizeStyle(8, 6),
});

// --- Variant ---

// Variant-specific hover styles only engage when `interactive` is also applied.
export const variant = styleVariants({
  surface: {
    backgroundColor: background.panelTranslucent,
    boxShadow: `inset 0 0 0 1px ${neutralAlpha[6]}`,
    selectors: {
      [`&.${interactive}:not(:disabled):hover`]: {
        backgroundColor: neutralAlpha[3],
      },
    },
  },
  classic: {
    backgroundColor: background.panelSolid,
    boxShadow: `${shadow[3]}, inset 0 0 0 1px ${neutralAlpha[6]}`,
    selectors: {
      [`&.${interactive}:not(:disabled):hover`]: {
        boxShadow: `${shadow[4]}, inset 0 0 0 1px ${neutralAlpha[6]}`,
      },
    },
  },
  ghost: {
    selectors: {
      [`&.${interactive}:not(:disabled):hover`]: {
        backgroundColor: neutralAlpha[3],
      },
    },
  },
});
