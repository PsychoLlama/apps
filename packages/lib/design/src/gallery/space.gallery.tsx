import type { GalleryAxis, GalleryListing } from '@lib/gallery';
import { space } from '@lib/design';
import * as css from './space.gallery.css';

/** One chart cell: a bar sized to a single spacing step. */
interface Cell {
  /** Resolved width value for the bar. */
  space: string;
}

/** One column per spacing step, widening left to right. */
const steps: ReadonlyArray<GalleryAxis<Cell>> = (
  Object.entries(space) as ReadonlyArray<[string, string]>
).map(([step, value]) => ({
  title: `space[${step}]`,
  props: { space: value },
}));

/**
 * Gallery listing for `@lib/design`'s spacing scale. A single x-axis of bars,
 * each one step wider, charting the 4px-based progression from inline gaps up
 * to layout-level spacing.
 */
export default {
  title: 'Spacing',
  render: (props) => <div class={css.bar} style={{ '--space': props.space }} />,
  sections: [{ title: 'Scale', align: { columns: 'center' }, columns: steps }],
} satisfies GalleryListing<Cell>;
