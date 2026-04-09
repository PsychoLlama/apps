/**
 * Box shadow tokens derived from Radix UI Themes' shadow scale.
 * Source: https://github.com/radix-ui/themes (MIT)
 * Docs: https://www.radix-ui.com/themes/docs/theme/shadows
 *
 * 6-level elevation scale. Most levels use plain constants with
 * `light-dark()` on the color values. Levels where Radix defines
 * structurally different shadows per mode (shadow 1 and 3) use CSS
 * custom properties switched via `prefers-color-scheme` and
 * `data-color-scheme` — the same mechanism used for color tokens.
 *
 * No `color-mix()` progressive enhancement (matches project convention).
 * No component-specific shadow tokens. Some components eject from the
 * global scale for one of three reasons. Define those shadows in
 * component files, not here.
 *
 *   1. Structural lines, not elevation. Table row separators and
 *      card-surface borders are single-pixel outlines/dividers.
 *      - table.css line 3: `inset 0 -1px var(--gray-a5)`
 *      - base-card.css lines 67-77: `0 0 0 1px` at rest/hover/active
 *
 *   2. Animation-matched layers. Classic card and classic button need
 *      identical layer counts across rest/hover/active so CSS can
 *      interpolate `transition: box-shadow`. Radix uses 6-layer
 *      inner/outer splits with zeroed-out layers that grow on hover.
 *      - base-card.css lines 93-205 (12 token definitions)
 *      - base-button.css lines 74-248 (3D beveled press effect)
 *
 *   3. Scale mismatch. Slider thumbs are too small for global shadows.
 *      Kbd uses `em` units so shadows scale with font size.
 *      - slider.css: 3 variant-specific thumb shadows
 *      - kbd.css lines 6-23: em-based embossed keycap effect
 *
 *   Radix source (commit 3d286ce):
 *   https://github.com/radix-ui/themes/blob/3d286ce/packages/radix-ui-themes/src/components/table.css
 *   https://github.com/radix-ui/themes/blob/3d286ce/packages/radix-ui-themes/src/components/_internal/base-card.css
 *   https://github.com/radix-ui/themes/blob/3d286ce/packages/radix-ui-themes/src/components/_internal/base-button.css
 *   https://github.com/radix-ui/themes/blob/3d286ce/packages/radix-ui-themes/src/components/slider.css
 *   https://github.com/radix-ui/themes/blob/3d286ce/packages/radix-ui-themes/src/components/kbd.css
 */
import { assignVars, createThemeContract } from '@vanilla-extract/css';
import { assignColorSchemeVars, lightDark } from '../color-scheme';
import { neutralAlpha } from './color.css';
import { black } from '../palette/black';

// --- Levels with mode-dependent geometry (CSS custom properties) ---

const shadowTheme = createThemeContract({ 1: '', 3: '' });

const shadow1Light = [
  `inset 0 0 0 1px ${neutralAlpha[5]}`,
  `inset 0 1.5px 2px 0 ${neutralAlpha[2]}`,
  `inset 0 1.5px 2px 0 ${black[2]}`,
].join(', ');

const shadow1Dark = [
  `inset 0 -1px 1px 0 ${neutralAlpha[3]}`,
  `inset 0 0 0 1px ${neutralAlpha[3]}`,
  `inset 0 3px 4px 0 ${black[5]}`,
  `inset 0 0 0 1px ${neutralAlpha[4]}`,
].join(', ');

const shadow3Light = [
  `0 0 0 1px ${neutralAlpha[3]}`,
  `0 2px 3px -2px ${neutralAlpha[3]}`,
  `0 3px 12px -4px ${black[2]}`,
  `0 4px 16px -8px ${black[2]}`,
].join(', ');

const shadow3Dark = [
  `0 0 0 1px ${neutralAlpha[6]}`,
  `0 2px 3px -2px ${black[3]}`,
  `0 3px 8px -2px ${black[6]}`,
  `0 4px 12px -4px ${black[7]}`,
].join(', ');

const lightVars = assignVars(shadowTheme, {
  1: shadow1Light,
  3: shadow3Light,
});

const darkVars = assignVars(shadowTheme, {
  1: shadow1Dark,
  3: shadow3Dark,
});

assignColorSchemeVars(lightVars, darkVars);

// --- Levels with identical geometry in both modes (plain constants) ---

export const shadow = {
  /** Inset/recessed — form inputs, thumbs, switches. */
  1: shadowTheme[1],

  /** Slight elevation — floating indicators, segmented controls. */
  2: `0 0 0 1px ${lightDark(neutralAlpha[3], neutralAlpha[6])}, 0 0 0 0.5px ${lightDark(black[1], black[3])}, 0 1px 1px 0 ${lightDark(neutralAlpha[2], black[6])}, 0 2px 1px -1px ${lightDark(black[1], black[6])}, 0 1px 3px 0 ${lightDark(black[1], black[5])}`,

  /** Medium elevation — general-purpose raised surface. */
  3: shadowTheme[3],

  /** High elevation — hover cards, tooltips. */
  4: `0 0 0 1px ${lightDark(neutralAlpha[3], neutralAlpha[6])}, 0 8px 40px ${lightDark(black[1], black[3])}, 0 12px 32px -16px ${lightDark(neutralAlpha[3], black[5])}`,

  /** Higher elevation — selects, popovers, dropdown menus. */
  5: `0 0 0 1px ${lightDark(neutralAlpha[3], neutralAlpha[6])}, 0 12px 60px ${lightDark(black[3], black[5])}, 0 12px 32px -16px ${lightDark(neutralAlpha[5], black[7])}`,

  /** Maximum elevation — dialogs, modal layers. */
  6: `0 0 0 1px ${lightDark(neutralAlpha[3], neutralAlpha[6])}, 0 12px 60px ${lightDark(black[3], black[4])}, 0 16px 64px ${lightDark(neutralAlpha[2], black[6])}, 0 16px 36px -20px ${lightDark(neutralAlpha[7], black[11])}`,
} as const;
