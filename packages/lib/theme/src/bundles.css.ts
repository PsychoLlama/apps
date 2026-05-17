import { setThemeColors, type ThemeVariantConfig } from '@lib/design/theme';
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
import { THEME_ATTRIBUTE, type ThemeId } from './catalog';

/**
 * Bundle every built-in theme into a single `setThemeColors` call.
 * Each entry pairs an accent with the Radix-recommended tinted neutral
 * (https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette).
 *
 * The semantic roles (`danger`, `warning`, `success`) and grayscale
 * text are held constant across every variant so red/amber/green
 * keep a consistent meaning regardless of which variant is active.
 *
 * The `satisfies` constraint enforces parity with `THEMES` in
 * `catalog.ts` — adding an id in one place without the other is a
 * type error.
 */
setThemeColors({
  attribute: THEME_ATTRIBUTE,
  constants: {
    danger: red,
    warning: amber,
    success: grass,
    text: { 11: gray.solid[11], 12: gray.solid[12] },
  },
  variants: {
    blue: { accent: blue, neutral: slate },
    sky: { accent: sky, neutral: slate },
    cyan: { accent: cyan, neutral: slate },
    teal: { accent: teal, neutral: sage },
    jade: { accent: jade, neutral: sage },
    indigo: { accent: indigo, neutral: slate },
    iris: { accent: iris, neutral: slate },
    violet: { accent: violet, neutral: mauve },
    purple: { accent: purple, neutral: mauve },
    plum: { accent: plum, neutral: mauve },
    pink: { accent: pink, neutral: mauve },
    orange: { accent: orange, neutral: sand },
    brown: { accent: brown, neutral: sand },
  } satisfies Record<ThemeId, ThemeVariantConfig>,
});
