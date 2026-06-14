import type { GalleryListing } from '@lib/gallery';
import type { ColorPalette } from '@lib/design';
import { colorScaleIds } from '@lib/design/color-scheme';

import { amber } from '@lib/design/palette/amber';
import { blue } from '@lib/design/palette/blue';
import { bronze } from '@lib/design/palette/bronze';
import { brown } from '@lib/design/palette/brown';
import { crimson } from '@lib/design/palette/crimson';
import { cyan } from '@lib/design/palette/cyan';
import { gold } from '@lib/design/palette/gold';
import { grass } from '@lib/design/palette/grass';
import { gray } from '@lib/design/palette/gray';
import { green } from '@lib/design/palette/green';
import { indigo } from '@lib/design/palette/indigo';
import { iris } from '@lib/design/palette/iris';
import { jade } from '@lib/design/palette/jade';
import { lime } from '@lib/design/palette/lime';
import { mauve } from '@lib/design/palette/mauve';
import { mint } from '@lib/design/palette/mint';
import { olive } from '@lib/design/palette/olive';
import { orange } from '@lib/design/palette/orange';
import { pink } from '@lib/design/palette/pink';
import { plum } from '@lib/design/palette/plum';
import { purple } from '@lib/design/palette/purple';
import { red } from '@lib/design/palette/red';
import { ruby } from '@lib/design/palette/ruby';
import { sage } from '@lib/design/palette/sage';
import { sand } from '@lib/design/palette/sand';
import { sky } from '@lib/design/palette/sky';
import { slate } from '@lib/design/palette/slate';
import { teal } from '@lib/design/palette/teal';
import { tomato } from '@lib/design/palette/tomato';
import { violet } from '@lib/design/palette/violet';
import { yellow } from '@lib/design/palette/yellow';

import * as css from './colors.gallery.css';

/** A scale step, 1–12. */
type Step = (typeof colorScaleIds)[number];

/** One chart cell: a single hue's solid color at a single scale step. */
interface Swatch {
  palette: ColorPalette;
  step: Step;
}

/**
 * Every solid hue, in chart order. Importing each palette also registers its
 * `:root` CSS vars, so the swatches resolve.
 */
const hues: ReadonlyArray<{ name: string; palette: ColorPalette }> = [
  { name: 'gray', palette: gray },
  { name: 'mauve', palette: mauve },
  { name: 'slate', palette: slate },
  { name: 'sage', palette: sage },
  { name: 'olive', palette: olive },
  { name: 'sand', palette: sand },
  { name: 'tomato', palette: tomato },
  { name: 'red', palette: red },
  { name: 'ruby', palette: ruby },
  { name: 'crimson', palette: crimson },
  { name: 'pink', palette: pink },
  { name: 'plum', palette: plum },
  { name: 'purple', palette: purple },
  { name: 'violet', palette: violet },
  { name: 'iris', palette: iris },
  { name: 'indigo', palette: indigo },
  { name: 'blue', palette: blue },
  { name: 'cyan', palette: cyan },
  { name: 'teal', palette: teal },
  { name: 'jade', palette: jade },
  { name: 'green', palette: green },
  { name: 'grass', palette: grass },
  { name: 'bronze', palette: bronze },
  { name: 'gold', palette: gold },
  { name: 'brown', palette: brown },
  { name: 'orange', palette: orange },
  { name: 'amber', palette: amber },
  { name: 'yellow', palette: yellow },
  { name: 'lime', palette: lime },
  { name: 'mint', palette: mint },
  { name: 'sky', palette: sky },
];

/**
 * Gallery listing for `@lib/design`'s color palettes. The grid permutes every
 * hue (rows) against the full 1–12 scale (columns), drawing one solid swatch per
 * cell. Alpha variants are omitted.
 */
export default {
  title: 'Colors',
  render: (props) => (
    <div
      class={css.swatch}
      style={{ 'background-color': props.palette!.solid[props.step!] }}
    />
  ),
  sections: [
    {
      title: 'Solid',
      columns: colorScaleIds.map((step) => ({
        title: String(step),
        props: { step },
      })),
      rows: hues.map((hue) => ({
        title: hue.name,
        props: { palette: hue.palette },
      })),
    },
  ],
} satisfies GalleryListing<Swatch>;
