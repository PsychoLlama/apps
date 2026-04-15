import { createThemeContract } from '@vanilla-extract/css';
import { colorScaleShape } from '../color-scheme';

/**
 * Follow this guide to choose a color palette:
 * https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
 */

// --- Contracts ---

/** Brand color. There is no secondary/tertiary. */
export const accent = createThemeContract(colorScaleShape);

/** Semi-transparent variants of the accent. */
export const accentAlpha = createThemeContract(colorScaleShape);

/** Neutral scale, partially tinted to match accent. */
export const neutral = createThemeContract(colorScaleShape);

/** Semi-transparent neutral variants. */
export const neutralAlpha = createThemeContract(colorScaleShape);

/** Destructive actions and error states. */
export const danger = createThemeContract(colorScaleShape);

/** Caution and warning states. */
export const warning = createThemeContract(colorScaleShape);

/** Positive outcomes and active status. */
export const success = createThemeContract(colorScaleShape);

export const text = createThemeContract({
  /** Low-contrast text (neutral step 11). */
  lowContrast: null,
  /** High-contrast text (neutral step 12). */
  highContrast: null,
});

export type TextColor = keyof typeof text;

export const background = createThemeContract({
  /** App canvas. The lowest layer, applied to the page body. */
  page: null,
  /** Opaque elevated containers: cards, dialogs, popovers, sidebars. */
  panelSolid: null,
  /** Semi-transparent elevated containers. Pair with `backdrop-filter: blur(64px)` for frosted glass. */
  panelTranslucent: null,
  /** Recessed interactive surfaces: text inputs, selects, unchecked checkboxes/radios. */
  surface: null,
  /** Modal scrim behind dialogs and drawers. */
  overlay: null,
});

export type BackgroundColor = keyof typeof background;
