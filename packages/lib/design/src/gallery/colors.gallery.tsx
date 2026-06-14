import type { GalleryAxis, GalleryListing, GallerySection } from '@lib/gallery';
import type { ColorPalette } from '@lib/design';
import { accent, danger, neutral, success, warning } from '@lib/design';
import { colorScaleIds, type ColorContract } from '@lib/design/color-scheme';

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

// Pure black/white overlay scales. These ship as raw 12-step alpha values
// (`step1`–`step12`) rather than registered palettes, so they're imported
// relatively and reshaped into a `ColorContract` below.
import * as black from '../palette/black';
import * as white from '../palette/white';

import * as css from './colors.gallery.css';

/** A scale step, 1–12. */
type Step = (typeof colorScaleIds)[number];

/** A hue paired with its sentence-cased display name. */
interface NamedPalette {
  name: string;
  palette: ColorPalette;
}

/** Which facet of a semantic role a cell draws from. */
type Variant = 'solid' | 'alpha';

/**
 * One chart cell: a single scale's color at a single step. The hue sections
 * bind `scale` directly; the semantic section binds a `role` + `variant` pair
 * instead, deferring the `role[variant]` lookup to render so a column (Solid /
 * Alpha) and row (token name) can each contribute half the coordinate.
 */
interface Swatch {
  scale?: ColorContract;
  role?: ColorPalette;
  variant?: Variant;
  step: Step;
}

/**
 * Every hue in chart order — neutrals first, then the chromatic scales.
 * Importing each palette also registers its `:root` CSS vars, so the swatches
 * resolve.
 */
const palettes: ReadonlyArray<NamedPalette> = [
  { name: 'Gray', palette: gray },
  { name: 'Mauve', palette: mauve },
  { name: 'Slate', palette: slate },
  { name: 'Sage', palette: sage },
  { name: 'Olive', palette: olive },
  { name: 'Sand', palette: sand },
  { name: 'Tomato', palette: tomato },
  { name: 'Red', palette: red },
  { name: 'Ruby', palette: ruby },
  { name: 'Crimson', palette: crimson },
  { name: 'Pink', palette: pink },
  { name: 'Plum', palette: plum },
  { name: 'Purple', palette: purple },
  { name: 'Violet', palette: violet },
  { name: 'Iris', palette: iris },
  { name: 'Indigo', palette: indigo },
  { name: 'Blue', palette: blue },
  { name: 'Cyan', palette: cyan },
  { name: 'Teal', palette: teal },
  { name: 'Jade', palette: jade },
  { name: 'Green', palette: green },
  { name: 'Grass', palette: grass },
  { name: 'Bronze', palette: bronze },
  { name: 'Gold', palette: gold },
  { name: 'Brown', palette: brown },
  { name: 'Orange', palette: orange },
  { name: 'Amber', palette: amber },
  { name: 'Yellow', palette: yellow },
  { name: 'Lime', palette: lime },
  { name: 'Mint', palette: mint },
  { name: 'Sky', palette: sky },
];

/** Reshape a raw `step1`–`step12` overlay module into a `ColorContract`. */
const overlayScale = (raw: Record<`step${Step}`, string>): ColorContract => {
  const scale = {} as Record<Step, string>;
  colorScaleIds.forEach((id) => {
    scale[id] = raw[`step${id}`];
  });
  return scale;
};

/** One step column per scale id. */
const steps = colorScaleIds.map((step) => ({
  title: String(step),
  props: { step },
}));

/** One row per hue, bound to its solid or alpha scale. */
const paletteRows = (
  variant: 'solid' | 'alpha',
): ReadonlyArray<GalleryAxis<Swatch>> =>
  palettes.map(({ name, palette }) => ({
    title: name,
    props: { scale: palette[variant] },
  }));

/** The black/white overlay scales, shown alongside the alpha hues. */
const overlayRows: ReadonlyArray<GalleryAxis<Swatch>> = [
  { title: 'White', props: { scale: overlayScale(white) } },
  { title: 'Black', props: { scale: overlayScale(black) } },
];

/**
 * The semantic roles, in scale-semantics order. Each aliases a concrete hue at
 * theme time, so the swatches track whichever variant is active.
 */
const semanticRoles: ReadonlyArray<{ name: string; role: ColorPalette }> = [
  { name: 'Accent', role: accent },
  { name: 'Neutral', role: neutral },
  { name: 'Danger', role: danger },
  { name: 'Warning', role: warning },
  { name: 'Success', role: success },
];

/** Step 9 — the primary solid fill — is the representative step per role. */
const primaryStep: Step = 9;

/**
 * Semantic tokens at a glance: one row per role, with its primary solid and
 * alpha swatch side by side.
 */
const semanticSection: GallerySection<Swatch> = {
  title: 'Semantic',
  gap: 1,
  align: { rows: 'center', columns: 'center' },
  columns: [
    { title: 'Solid', props: { variant: 'solid', step: primaryStep } },
    { title: 'Alpha', props: { variant: 'alpha', step: primaryStep } },
  ],
  rows: semanticRoles.map(({ name, role }) => ({
    title: name,
    props: { role },
  })),
};

/** A tightly-packed, axis-aligned section over the given hue rows. */
const scaleSection = (
  title: string,
  rows: ReadonlyArray<GalleryAxis<Swatch>>,
): GallerySection<Swatch> => ({
  title,
  gap: 1,
  align: { rows: 'center', columns: 'center' },
  columns: steps,
  rows,
});

/**
 * Gallery listing for `@lib/design`'s color palettes. Each section permutes its
 * hues (rows) against the full 1–12 scale (columns), drawing one swatch per
 * cell: the opaque solid scales, then the translucent alpha scales with the
 * black/white overlays tacked on the end.
 */
export default {
  title: 'Color palette',
  render: (props) => (
    <div
      class={css.swatch}
      style={{
        '--swatch-color': (props.scale ?? props.role![props.variant!])[
          props.step!
        ],
      }}
    />
  ),
  sections: [
    scaleSection('Solid', paletteRows('solid')),
    scaleSection('Alpha', [...paletteRows('alpha'), ...overlayRows]),
    semanticSection,
  ],
} satisfies GalleryListing<Swatch>;
