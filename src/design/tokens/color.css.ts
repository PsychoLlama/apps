import { createThemeContract, globalStyle } from '@vanilla-extract/css';
import { aliasVars, colorScaleShape, lightDark } from '../color-scheme';
import { grayDark, grayLight } from '../palette/gray';
import { amber } from '../palette/amber.css';
import { blue, blueAlpha } from '../palette/blue.css';
import { grass } from '../palette/grass.css';
import { red } from '../palette/red.css';
import { slate, slateAlpha } from '../palette/slate.css';

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

const surfaceLight = 'rgba(255, 255, 255, 0.85)';
const surfaceDark = 'rgba(0, 0, 0, 0.25)';
const overlayLight = 'rgba(0, 0, 0, 0.38)';
const overlayDark = 'rgba(0, 0, 0, 0.6)';

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

// --- Assignment ---

globalStyle(':root', {
  vars: {
    ...aliasVars(accent, blue),
    ...aliasVars(accentAlpha, blueAlpha),
    ...aliasVars(neutral, slate),
    ...aliasVars(neutralAlpha, slateAlpha),
    ...aliasVars(danger, red),
    ...aliasVars(warning, amber),
    ...aliasVars(success, grass),

    [text.lowContrast]: lightDark(grayLight[11], grayDark[11]),
    [text.highContrast]: lightDark(grayLight[12], grayDark[12]),

    [background.page]: neutral[1],
    [background.panelSolid]: neutral[2],
    [background.panelTranslucent]: neutralAlpha[2],
    [background.surface]: lightDark(surfaceLight, surfaceDark),
    [background.overlay]: lightDark(overlayLight, overlayDark),
  },
});
