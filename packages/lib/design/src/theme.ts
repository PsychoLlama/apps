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

/**
 * Constants shared across every theme variant. Variants only declare
 * what differs (`accent` + tinted `neutral`); the semantic roles
 * (`danger`, `warning`, `success`) and grayscale text are pinned here
 * so users get a consistent meaning of red/amber/green regardless of
 * which variant is active.
 */
export interface ThemeConstants {
  danger: ColorPalette;
  warning: ColorPalette;
  success: ColorPalette;
  /** Source for `text.lowContrast` and `text.highContrast` (steps 11–12). */
  text: Pick<ColorPalette['solid'], 11 | 12>;
}

/** Per-variant palette pair plus its display label. */
export interface ThemeVariantConfig {
  accent: ColorPalette;
  neutral: ColorPalette;
  /** Human-readable name, e.g. for a theme picker. */
  label: string;
}

/**
 * Register one CSS rule per theme variant, each scoped to a
 * `:root[data-${attribute}="${id}"]` selector. Activation is driven
 * by the attribute on `:root` (stamped by the server entry); the
 * matching rule wins by specificity.
 *
 * Variants share `constants` for the non-accent semantic roles, so
 * adding a new variant is a one-line entry under `variants`.
 *
 * Returns the literal-typed id list and a labelled+ordered `themes`
 * list (in `variants` declaration order) so consumers can iterate the
 * registered set without redeclaring it.
 */
export const setThemeVariants = <
  const V extends Record<string, ThemeVariantConfig>,
>(config: {
  attribute: string;
  constants: ThemeConstants;
  variants: V;
}): {
  ids: ReadonlyArray<keyof V & string>;
  themes: ReadonlyArray<{ id: keyof V & string; label: string }>;
} => {
  const entries = Object.entries(config.variants) as Array<
    [keyof V & string, ThemeVariantConfig]
  >;

  for (const [id, variant] of entries) {
    globalStyle(`:root[data-${config.attribute}="${id}"]`, {
      vars: {
        ...aliasPalette(accent, variant.accent),
        ...aliasPalette(neutral, variant.neutral),
        ...aliasPalette(danger, config.constants.danger),
        ...aliasPalette(warning, config.constants.warning),
        ...aliasPalette(success, config.constants.success),

        [text.lowContrast]: config.constants.text[11],
        [text.highContrast]: config.constants.text[12],

        [background.page]: variant.neutral.solid[1],
        [background.panelSolid]: variant.neutral.solid[2],
        [background.panelTranslucent]: variant.neutral.alpha[2],
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

  return {
    ids: entries.map(([id]) => id),
    themes: entries.map(([id, variant]) => ({ id, label: variant.label })),
  };
};
