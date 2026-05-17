import { createThemeContract, createVar } from '@vanilla-extract/css';
import { colorScaleShape, type ColorPalette } from '../color-scheme';

/**
 * Follow this guide to choose a color palette:
 * https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
 */

// --- Contracts ---

/**
 * Empty `ColorPalette` contract for one semantic role. Each call creates
 * fresh CSS-var refs that `setThemeVariants` aliases to a concrete palette.
 */
const createPaletteContract = (): ColorPalette => ({
  solid: createThemeContract(colorScaleShape),
  alpha: createThemeContract(colorScaleShape),
  contrast: createVar(),
  surface: createVar(),
  indicator: createVar(),
  track: createVar(),
});

/** Brand color. There is no secondary/tertiary. */
export const accent = createPaletteContract();

/** Neutral scale, partially tinted to match accent. */
export const neutral = createPaletteContract();

/** Destructive actions and error states. */
export const danger = createPaletteContract();

/** Caution and warning states. */
export const warning = createPaletteContract();

/** Positive outcomes and active status. */
export const success = createPaletteContract();

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
