import { style, styleVariants } from '@vanilla-extract/css';
import { background, space } from '@lib/design';
import { inset } from '@lib/shell/frame.css';

/**
 * Base grid for a permutation view. Padded on the block axis so cells clear the
 * tab switcher above them, and packed to the start (`justify-content`) so tracks
 * flow left-to-right at their intrinsic size rather than stretching to fill.
 *
 * Scrolls on its own x-axis: the `max-content` tracks would otherwise overflow a
 * constrained viewport and scroll the whole document, so the grid keeps the
 * overflow to itself and the page stays put.
 *
 * Breaks flush to the viewport edges: the view (`content`) holds its children off
 * the edges by `inset`, which on a narrow screen reads as an invisible cutoff at
 * both ends of this scroller. A negative inline margin pulls the scrollport back
 * out to the edges, and an equal inline padding re-pads the cells inside it — so
 * the gutter moves *into* the scroll content where it belongs and the scroller
 * runs edge to edge. The margin and padding both read the same `inset` var, so
 * the breakout can never exceed the inset and overflow `content` (which clips x).
 *
 * The `background` makes this scrollport opaque for the same reason `content`
 * paints one — an opaque inner scroller gets the cheap compositor-driven scroll
 * path; a transparent one repaints on the main thread and janks.
 */
export const grid = style({
  justifyContent: 'start',
  paddingBlock: space[5],
  paddingInline: inset,
  marginInline: `calc(${inset} * -1)`,
  overflowX: 'auto',
  backgroundColor: background.page,
});

/**
 * `grid-template-columns` by total track count. Tracks are sized to their widest
 * cell (`max-content`) so every cell aligns down its column, dynamic variants
 * stay aligned, and cells never shrink below their content (no wrapping when the
 * viewport is constrained). The count is dynamic — a header column plus one per
 * axis entry — so it's selected here rather than expressed as a single rule.
 */
/**
 * Pins each header to its own axis so a section's `align` only affects the axis
 * it names. The grid's `align-items`/`justify-items` apply to every cell, which
 * would drag a column header's vertical alignment or a row header's horizontal
 * alignment along for the ride — a centered row label drifting off the left
 * edge, say. Each header opts out of the cross-axis alignment back to `start`;
 * its own-axis alignment still flows from the grid.
 */
export const columnHeader = style({ alignSelf: 'start' });
export const rowHeader = style({ justifySelf: 'start' });

/**
 * Gutters that hold the header labels clear of the cells when a section
 * tightens its `gap`. The grid gap is uniform — it can't separate the
 * header band from the cells on its own — so a section that packs its
 * cells tight pads its headers back out to stay legible.
 */
export const columnHeaderGutter = style({ paddingBlockEnd: space[2] });
export const rowHeaderGutter = style({ paddingInlineEnd: space[2] });

export const templateColumns = styleVariants(
  {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
    12: 12,
    13: 13,
  },
  (count) => ({ gridTemplateColumns: `repeat(${count}, max-content)` }),
);
