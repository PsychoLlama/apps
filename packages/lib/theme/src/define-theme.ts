import { setThemeColors } from '@lib/design/theme';
import type { ColorPalette } from '@lib/design/color-scheme';
import { amber } from '@lib/design/palette/amber';
import { grass } from '@lib/design/palette/grass';
import { gray } from '@lib/design/palette/gray';
import { red } from '@lib/design/palette/red';

/**
 * Bind one accent + matching tinted neutral into the theme contract.
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
  accent: ColorPalette,
  neutral: ColorPalette,
): void => {
  setThemeColors({
    accent,
    neutral,
    danger: red,
    warning: amber,
    success: grass,
    text: { 11: gray.solid[11], 12: gray.solid[12] },
  });
};
