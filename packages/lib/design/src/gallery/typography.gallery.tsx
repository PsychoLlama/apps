import type { GalleryAxis, GalleryListing } from '@lib/gallery';
import {
  fontFamily,
  fontWeight,
  typeScale,
  type FontWeight,
  type TypeScale,
} from '@lib/design';
import * as css from './typography.gallery.css';

/**
 * One specimen cell. Each section varies a different facet — the Scale section
 * the size, Families the stack, Weights the weight — and leaves the rest to the
 * font's defaults. Unset fields drop out of the inline style.
 */
interface Specimen {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontFamily: string;
  fontWeight: string;
}

/** Display size shared by the family and weight specimens. */
const sampleSize = typeScale[6];

/** One row per type-scale step, smallest to largest. */
const scale: ReadonlyArray<GalleryAxis<Specimen>> = (
  Object.keys(typeScale) as ReadonlyArray<`${TypeScale}`>
).map((step) => {
  const value = typeScale[Number(step) as TypeScale];
  return {
    title: `typeScale[${step}]`,
    props: {
      fontSize: value.fontSize,
      lineHeight: value.bodyLineHeight,
      letterSpacing: value.letterSpacing,
    },
  };
});

/** One row per font stack, rendered at the shared display size. */
const families: ReadonlyArray<GalleryAxis<Specimen>> = (
  Object.keys(fontFamily) as ReadonlyArray<keyof typeof fontFamily>
).map((name) => ({
  title: `fontFamily.${name}`,
  props: {
    fontFamily: fontFamily[name],
    fontSize: sampleSize.fontSize,
    lineHeight: sampleSize.bodyLineHeight,
  },
}));

/** One row per weight, rendered at the shared display size. */
const weights: ReadonlyArray<GalleryAxis<Specimen>> = (
  Object.entries(fontWeight) as ReadonlyArray<[FontWeight, string]>
).map(([name, value]) => ({
  title: `fontWeight.${name}`,
  props: {
    fontWeight: value,
    fontSize: sampleSize.fontSize,
    lineHeight: sampleSize.bodyLineHeight,
  },
}));

/**
 * Gallery listing for `@lib/design`'s typography tokens. Three views, each a
 * y-axis of pangram specimens — the size scale, the font families, and the
 * weight ramp — since type samples read best stacked at full width.
 */
export default {
  title: 'Typography',
  render: (props) => (
    <p
      class={css.specimen}
      style={{
        'font-size': props.fontSize,
        'line-height': props.lineHeight,
        'letter-spacing': props.letterSpacing,
        'font-family': props.fontFamily,
        'font-weight': props.fontWeight,
      }}
    >
      Sphinx of black quartz, judge my vow
    </p>
  ),
  sections: [
    { title: 'Scale', rows: scale },
    { title: 'Families', rows: families },
    { title: 'Weights', rows: weights },
  ],
} satisfies GalleryListing<Specimen>;
