import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { GalleryAxis, Listing } from '#gallery';
import { shadow } from '@lib/design';
import * as css from './shadow.gallery.css';

/** One chart cell: a panel raised to a single elevation level. */
interface Cell {
  /** Resolved `box-shadow` value for the panel. */
  shadow: string;
}

/** One column per elevation level, rising left to right. */
const levels: ReadonlyArray<GalleryAxis<Cell>> = (
  Object.entries(shadow) as ReadonlyArray<[string, string]>
).map(([level, value]) => ({
  title: level,
  props: { shadow: value },
}));

/**
 * Gallery listing for `@lib/design`'s shadow scale. A single x-axis of panels,
 * each raised one elevation level further, from the inset recess up to the
 * modal-layer drop shadow.
 */
export default {
  title: 'Shadow',
  render: (props) => (
    <div
      class={css.panel}
      style={assignInlineVars({ [css.shadowVar]: props.shadow })}
    />
  ),
  sections: [
    { title: 'Elevation', align: { columns: 'center' }, columns: levels },
  ],
} satisfies Listing<Cell>;
