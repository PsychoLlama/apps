import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { GalleryAxis, GalleryListing } from '@lib/gallery';
import { space } from '@lib/design';
import * as css from './space.gallery.css';

/** One chart cell: a dimension line measuring a single spacing step. */
interface Cell {
  /** Resolved length the measure line spans. */
  space: string;
}

/** One row per spacing step, lengthening top to bottom. */
const steps: ReadonlyArray<GalleryAxis<Cell>> = (
  Object.entries(space) as ReadonlyArray<[string, string]>
).map(([step, value]) => ({
  title: step,
  props: { space: value },
}));

/**
 * Gallery listing for `@lib/design`'s spacing scale. A y-axis of dimension lines
 * — an end-capped rule the width of each step — sharing a left edge so the
 * 4px-based progression reads as one comparable ruler.
 */
export default {
  title: 'Spacing',
  render: (props) => (
    <div
      class={css.measure}
      style={assignInlineVars({ [css.spaceVar]: props.space })}
    >
      <span class={css.tick} />
      <span class={css.rule} />
      <span class={css.tick} />
    </div>
  ),
  sections: [{ title: 'Scale', align: { rows: 'center' }, rows: steps }],
} satisfies GalleryListing<Cell>;
