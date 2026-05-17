import { setThemeVariants } from '@lib/design/theme';
import { amber } from '@lib/design/palette/amber';
import { blue } from '@lib/design/palette/blue';
import { brown } from '@lib/design/palette/brown';
import { cyan } from '@lib/design/palette/cyan';
import { grass } from '@lib/design/palette/grass';
import { gray } from '@lib/design/palette/gray';
import { indigo } from '@lib/design/palette/indigo';
import { iris } from '@lib/design/palette/iris';
import { jade } from '@lib/design/palette/jade';
import { mauve } from '@lib/design/palette/mauve';
import { orange } from '@lib/design/palette/orange';
import { pink } from '@lib/design/palette/pink';
import { plum } from '@lib/design/palette/plum';
import { purple } from '@lib/design/palette/purple';
import { red } from '@lib/design/palette/red';
import { sage } from '@lib/design/palette/sage';
import { sand } from '@lib/design/palette/sand';
import { sky } from '@lib/design/palette/sky';
import { slate } from '@lib/design/palette/slate';
import { teal } from '@lib/design/palette/teal';
import { violet } from '@lib/design/palette/violet';

/**
 * `dataset` key on `<html>` that selects the active theme. The matching
 * `:root[data-theme="<id>"]` rule emitted by the bundle wins by
 * specificity. Shared so the CSS selector, server stamp, and storybook
 * preview stay in lockstep — use as `dataset[THEME_ATTRIBUTE]` in JS
 * and pair with the `data-` prefix in CSS selectors.
 */
export const THEME_ATTRIBUTE = 'theme';

/**
 * Bundle every built-in theme into a single `setThemeVariants` call.
 * Each entry pairs an accent with the Radix-recommended tinted neutral
 * (https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette)
 * and carries the display label used by theme pickers.
 *
 * The semantic roles (`danger`, `warning`, `success`) and grayscale
 * text are held constant across every variant so red/amber/green
 * keep a consistent meaning regardless of which variant is active.
 */
export const { ids: THEME_IDS, themes: THEMES } = setThemeVariants({
  attribute: THEME_ATTRIBUTE,
  constants: {
    danger: red,
    warning: amber,
    success: grass,
    text: { 11: gray.solid[11], 12: gray.solid[12] },
  },
  variants: {
    blue: { accent: blue, neutral: slate, label: 'Blue' },
    brown: { accent: brown, neutral: sand, label: 'Brown' },
    cyan: { accent: cyan, neutral: slate, label: 'Cyan' },
    indigo: { accent: indigo, neutral: slate, label: 'Indigo' },
    iris: { accent: iris, neutral: slate, label: 'Iris' },
    jade: { accent: jade, neutral: sage, label: 'Jade' },
    orange: { accent: orange, neutral: sand, label: 'Orange' },
    pink: { accent: pink, neutral: mauve, label: 'Pink' },
    plum: { accent: plum, neutral: mauve, label: 'Plum' },
    purple: { accent: purple, neutral: mauve, label: 'Purple' },
    sky: { accent: sky, neutral: slate, label: 'Sky' },
    teal: { accent: teal, neutral: sage, label: 'Teal' },
    violet: { accent: violet, neutral: mauve, label: 'Violet' },
  },
});

/** Identifier for a built-in theme. */
export type ThemeId = (typeof THEME_IDS)[number];

/**
 * Theme rendered when nothing else is selected. The server entry
 * stamps this onto `<html>` so the DOM never reaches the browser
 * with zero (or multiple) themes active.
 */
export const DEFAULT_THEME_ID: ThemeId = 'blue';

/**
 * Per-theme accent swatch (Radix scale `9`). Drop directly into a
 * Vanilla Extract style value — e.g. `styleVariants(SWATCHES, ...)` to
 * paint a per-theme color into a CSS rule.
 */
export const SWATCHES: Record<ThemeId, string> = {
  blue: blue.solid[9],
  brown: brown.solid[9],
  cyan: cyan.solid[9],
  indigo: indigo.solid[9],
  iris: iris.solid[9],
  jade: jade.solid[9],
  orange: orange.solid[9],
  pink: pink.solid[9],
  plum: plum.solid[9],
  purple: purple.solid[9],
  sky: sky.solid[9],
  teal: teal.solid[9],
  violet: violet.solid[9],
};
