/**
 * Card styles.
 *
 * Ported from Radix UI Themes Card. Deviations:
 * - Neutral only (no color scales).
 * - Interactive states are gated by an `interactive` class set by the
 *   component when `as` is `'a' | 'button' | 'label'`, instead of selecting
 *   on those element names.
 * - The border is drawn on an `::after` pseudo-element (above children)
 *   so an `Inset` bleeding to an edge cannot cover it. The card's
 *   translucent/solid fill stays on the root element itself; we don't
 *   need Radix's `::before` for background layering since our
 *   `panelTranslucent` token already handles that case.
 *
 * @see https://www.radix-ui.com/themes/docs/components/card
 */

import { style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  background,
  fast,
  neutral,
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

// The border overlay sits on `::after`, which paints above non-positioned
// children (the default stacking for an absolutely-positioned pseudo-element).
// That keeps the card outline visible even when an Inset bleeds to the edge.
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
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      borderRadius: cardBorderRadius,
      transitionProperty: 'box-shadow',
      transitionDuration: fast[2],
      transitionTimingFunction: standard.productive,
    },
  },
});

/** Applied by the component when `as` is an interactive tag. */
export const interactive = style({
  selectors: {
    '&:where(:not(:disabled))': {
      cursor: 'pointer',
    },
    '&:where(:not(:disabled):focus-visible)': {
      outline: `2px solid ${accent.solid[8]}`,
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

// Variant-specific hover/active styles only engage when `interactive` is also applied.
const borderShadow = `inset 0 0 0 1px ${neutral.alpha[6]}`;

export const variant = styleVariants({
  surface: {
    backgroundColor: background.panelTranslucent,
    selectors: {
      '&::after': { boxShadow: borderShadow },
      [`&:where(.${interactive}:not(:disabled):hover)`]: {
        backgroundColor: neutral.alpha[3],
      },
      [`&:where(.${interactive}:not(:disabled):active)`]: {
        backgroundColor: neutral.alpha[4],
      },
    },
  },
  classic: {
    backgroundColor: background.panelSolid,
    boxShadow: shadow[3],
    selectors: {
      '&::after': { boxShadow: borderShadow },
      [`&:where(.${interactive}:not(:disabled):hover)`]: {
        boxShadow: shadow[4],
      },
      [`&:where(.${interactive}:not(:disabled):active)`]: {
        boxShadow: shadow[2],
      },
    },
  },
  ghost: {
    selectors: {
      [`&:where(.${interactive}:not(:disabled):hover)`]: {
        backgroundColor: neutral.alpha[3],
      },
      [`&:where(.${interactive}:not(:disabled):active)`]: {
        backgroundColor: neutral.alpha[4],
      },
    },
  },
});
