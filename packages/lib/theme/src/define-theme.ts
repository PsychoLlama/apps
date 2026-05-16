import { setThemeColors, type ThemeColorConfig } from '@lib/design/theme';
import type { ColorPalette } from '@lib/design/color-scheme';
import { amber } from '@lib/design/palette/amber';
import { grass } from '@lib/design/palette/grass';
import { gray } from '@lib/design/palette/gray';
import { red } from '@lib/design/palette/red';
import type { ThemeId } from './catalog';

/** Selector that activates a theme by id: `:root[data-theme="<id>"]`. */
const themeSelector = (id: ThemeId): string => `:root[data-theme="${id}"]`;

/**
 * Bind one accent + matching tinted neutral into the theme contract,
 * scoped under both `:root` (default) and `:root[data-theme="<id>"]`
 * (explicit override). The default-flagged call also writes to the
 * bare `:root` so the theme applies when no `data-theme` attribute
 * is present.
 *
 * Each `bundles/<accent>.css.ts` file calls this once. The semantic
 * roles (`danger`, `warning`, `success`) and grayscale text are held
 * constant across every variant so users get a consistent meaning of
 * red/amber/green regardless of which accent is active.
 *
 * Pair `accent` with the Radix-recommended tinted gray for `neutral`
 * (see https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette).
 */
export const defineTheme = (
  id: ThemeId,
  accent: ColorPalette,
  neutral: ColorPalette,
  options: { default?: boolean } = {},
): void => {
  const config: ThemeColorConfig = {
    accent,
    neutral,
    danger: red,
    warning: amber,
    success: grass,
    text: { 11: gray.solid[11], 12: gray.solid[12] },
  };

  if (options.default) setThemeColors(config);
  setThemeColors(config, themeSelector(id));
};
