import { style, styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';

/**
 * Base grid for a permutation view. Padded on the block axis so cells clear the
 * tab switcher above them, and packed to the start (`justify-content`) so tracks
 * flow left-to-right at their intrinsic size rather than stretching to fill.
 *
 * Scrolls on its own x-axis: the `max-content` tracks would otherwise overflow a
 * constrained viewport and scroll the whole document, so the grid keeps the
 * overflow to itself and the page stays put.
 */
export const grid = style({
  justifyContent: 'start',
  paddingBlock: space[5],
  overflowX: 'auto',
});

/**
 * `grid-template-columns` by total track count. Tracks are sized to their widest
 * cell (`max-content`) so every cell aligns down its column, dynamic variants
 * stay aligned, and cells never shrink below their content (no wrapping when the
 * viewport is constrained). The count is dynamic — a header column plus one per
 * axis entry — so it's selected here rather than expressed as a single rule.
 */
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
