import { globalStyle } from '@vanilla-extract/css';

import { aliasVars, lightDark, type ColorContract } from './color-scheme';
import {
  accent,
  accentAlpha,
  background,
  danger,
  neutral,
  neutralAlpha,
  success,
  text,
  warning,
} from './tokens/color.css';

export interface ThemeColorConfig {
  accent: ColorContract;
  accentAlpha: ColorContract;
  neutral: ColorContract;
  neutralAlpha: ColorContract;
  danger: ColorContract;
  warning: ColorContract;
  success: ColorContract;
  /** Scale used for text colors (steps 11 and 12). */
  text: ColorContract;
}

let assigned = false;

/**
 * Bind concrete palettes to the color theme. Call exactly once from a
 * `.css.ts` file. Throws if called more than once.
 *
 * Scales (accent, neutral, danger, etc.) are aliased 1-12. Text is
 * derived from steps 11–12 of the provided scale. Background tokens
 * are derived from the neutral/neutralAlpha scales. Surface and overlay
 * are constants.
 */
export function setThemeColors(config: ThemeColorConfig): void {
  if (assigned) {
    throw new Error(
      'setThemeColors() has already been called. Theme colors can only be set once.',
    );
  }
  assigned = true;

  globalStyle(':root', {
    vars: {
      ...aliasVars(accent, config.accent),
      ...aliasVars(accentAlpha, config.accentAlpha),
      ...aliasVars(neutral, config.neutral),
      ...aliasVars(neutralAlpha, config.neutralAlpha),
      ...aliasVars(danger, config.danger),
      ...aliasVars(warning, config.warning),
      ...aliasVars(success, config.success),

      [text.lowContrast]: config.text[11],
      [text.highContrast]: config.text[12],

      [background.page]: config.neutral[1],
      [background.panelSolid]: config.neutral[2],
      [background.panelTranslucent]: config.neutralAlpha[2],
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
}
