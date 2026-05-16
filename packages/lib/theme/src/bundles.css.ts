import type { ColorPalette } from '@lib/design/color-scheme';
import { blue } from '@lib/design/palette/blue';
import { brown } from '@lib/design/palette/brown';
import { cyan } from '@lib/design/palette/cyan';
import { indigo } from '@lib/design/palette/indigo';
import { iris } from '@lib/design/palette/iris';
import { jade } from '@lib/design/palette/jade';
import { mauve } from '@lib/design/palette/mauve';
import { orange } from '@lib/design/palette/orange';
import { pink } from '@lib/design/palette/pink';
import { plum } from '@lib/design/palette/plum';
import { purple } from '@lib/design/palette/purple';
import { sage } from '@lib/design/palette/sage';
import { sand } from '@lib/design/palette/sand';
import { sky } from '@lib/design/palette/sky';
import { slate } from '@lib/design/palette/slate';
import { teal } from '@lib/design/palette/teal';
import { violet } from '@lib/design/palette/violet';
import { THEMES, type ThemeId } from './catalog';
import { defineTheme } from './define-theme';

// Accent + tinted-neutral pair per theme. `Record<ThemeId, ...>` makes
// TS enforce one entry per id — adding a theme to `THEMES` without a
// palette mapping here is a type error, and vice versa.
const PALETTES: Record<
  ThemeId,
  { accent: ColorPalette; neutral: ColorPalette }
> = {
  blue: { accent: blue, neutral: slate },
  brown: { accent: brown, neutral: sand },
  cyan: { accent: cyan, neutral: slate },
  indigo: { accent: indigo, neutral: slate },
  iris: { accent: iris, neutral: slate },
  jade: { accent: jade, neutral: sage },
  orange: { accent: orange, neutral: sand },
  pink: { accent: pink, neutral: mauve },
  plum: { accent: plum, neutral: mauve },
  purple: { accent: purple, neutral: mauve },
  sky: { accent: sky, neutral: slate },
  teal: { accent: teal, neutral: sage },
  violet: { accent: violet, neutral: mauve },
};

for (const { id } of THEMES) {
  defineTheme(id, PALETTES[id].accent, PALETTES[id].neutral);
}
