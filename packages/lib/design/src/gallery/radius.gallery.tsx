import type { GalleryAxis, GalleryListing } from '@lib/gallery';
import { radius } from '@lib/design';
import * as css from './radius.gallery.css';

/** One chart cell: a square rounded to a single radius step. */
interface Cell {
  /** Resolved `border-radius` value for the swatch. */
  radius: string;
}

/** One column per radius step, in scale order with `full` last. */
const steps: ReadonlyArray<GalleryAxis<Cell>> = (
  Object.entries(radius) as ReadonlyArray<[string, string]>
).map(([step, value]) => ({
  title: step === 'full' ? 'radius.full' : `radius[${step}]`,
  props: { radius: value },
}));

/**
 * Gallery listing for `@lib/design`'s radius scale. A single x-axis of squares,
 * each rounded one step further, from the compact-control radius up through the
 * full pill.
 */
export default {
  title: 'Radius',
  render: (props) => (
    <div class={css.box} style={{ '--radius': props.radius }} />
  ),
  sections: [{ title: 'Scale', align: { columns: 'center' }, columns: steps }],
} satisfies GalleryListing<Cell>;
