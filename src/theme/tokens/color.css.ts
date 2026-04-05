import {
  assignVars,
  createThemeContract,
  globalStyle,
} from '@vanilla-extract/css';

import {
  blueDark,
  blueDarkAlpha,
  blueLight,
  blueLightAlpha,
} from '../palette/blue.css';
import type { ColorScale } from '../palette/color-palette';
import { grayDark, grayLight } from '../palette/gray.css';
import {
  slateDark,
  slateDarkAlpha,
  slateLight,
  slateLightAlpha,
} from '../palette/slate.css';

/**
 * Follow this guide to choose a color palette:
 * https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
 */

const colorScaleIds = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const satisfies Array<keyof ColorScale>;

const colorScaleShape = Object.fromEntries(
  colorScaleIds.map((id) => [id, '']),
) as Record<keyof ColorScale, string>;

// --- Contracts ---

/** Brand color. There is no secondary/tertiary. */
export const accent = createThemeContract(colorScaleShape);

/** Semi-transparent variants of the accent. */
export const accentAlpha = createThemeContract(colorScaleShape);

/** Neutral scale, partially tinted to match accent. */
export const neutral = createThemeContract(colorScaleShape);

/** Semi-transparent neutral variants. */
export const neutralAlpha = createThemeContract(colorScaleShape);

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

/** Zip two color scales into `light-dark()` var assignments against a contract. */
const assignLightDark = (
  contract: ReturnType<typeof createThemeContract<typeof colorScaleShape>>,
  light: ColorScale,
  dark: ColorScale,
): Record<string, string> => {
  const keys = Object.keys(light).map(Number) as Array<keyof ColorScale>;
  const merged = structuredClone(colorScaleShape);

  for (const key of keys) {
    merged[key] = lightDark(light[key], dark[key]);
  }

  return assignVars(contract, merged);
};

const lightDark = (light: string, dark: string): string => {
  return `light-dark(${light}, ${dark})`;
};

globalStyle(':root', {
  colorScheme: 'light dark',
  vars: {
    ...assignLightDark(accent, blueLight, blueDark),
    ...assignLightDark(accentAlpha, blueLightAlpha, blueDarkAlpha),
    ...assignLightDark(neutral, slateLight, slateDark),
    ...assignLightDark(neutralAlpha, slateLightAlpha, slateDarkAlpha),

    [text.lowContrast]: lightDark(grayLight[11], grayDark[11]),
    [text.highContrast]: lightDark(grayLight[12], grayDark[12]),

    [background.page]: neutral[1],
    [background.panelSolid]: neutral[2],
    [background.panelTranslucent]: neutralAlpha[2],
    [background.surface]: lightDark(surfaceLight, surfaceDark),
    [background.overlay]: lightDark(overlayLight, overlayDark),
  },
});

// Explicit overrides
globalStyle(':root[color-scheme="light"]', { colorScheme: 'light' });
globalStyle(':root[color-scheme="dark"]', { colorScheme: 'dark' });
