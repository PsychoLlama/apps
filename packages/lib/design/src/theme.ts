import { globalStyle } from '@vanilla-extract/css';

import { aliasPalette, lightDark, type ColorPalette } from './color-scheme';
import {
  accent,
  background,
  danger,
  neutral,
  success,
  text,
  warning,
} from './tokens/color.css';

export interface ThemeColorConfig {
  accent: ColorPalette;
  neutral: ColorPalette;
  danger: ColorPalette;
  warning: ColorPalette;
  success: ColorPalette;
  /** Source for `text.lowContrast` and `text.highContrast` (steps 11–12). */
  text: Pick<ColorPalette['solid'], 11 | 12>;
}

/**
 * Bind concrete palettes to the color theme. Each call is intended to
 * live in its own `.css.ts` bundle so that the host can emit one CSS
 * file per accent and pick at load time which bundle to apply — only
 * one bundle's `:root` rule reaches the browser per page.
 *
 * Each semantic role (`accent`, `neutral`, `danger`, `warning`, `success`)
 * takes one full `ColorPalette` covering solid + alpha + meta tokens.
 * Text comes from steps 11–12 of an untinted scale. Background tokens
 * are derived from the neutral palette. Surface and overlay are constants.
 */
export const setThemeColors = (config: ThemeColorConfig): void => {
  globalStyle(':root', {
    vars: {
      ...aliasPalette(accent, config.accent),
      ...aliasPalette(neutral, config.neutral),
      ...aliasPalette(danger, config.danger),
      ...aliasPalette(warning, config.warning),
      ...aliasPalette(success, config.success),

      [text.lowContrast]: config.text[11],
      [text.highContrast]: config.text[12],

      [background.page]: config.neutral.solid[1],
      [background.panelSolid]: config.neutral.solid[2],
      [background.panelTranslucent]: config.neutral.alpha[2],
      [background.surface]: lightDark(
        'rgba(255, 255, 255, 0.85)',
        'rgba(0, 0, 0, 0.25)',
      ),
      [background.overlay]: lightDark(
        'rgba(0, 0, 0, 0.38)',
        'rgba(0, 0, 0, 0.6)',
      ),
    },
  });
};
