import { style, styleVariants } from '@vanilla-extract/css';
import { space } from '@lib/design';

/**
 * Base grid for a permutation view. Padded on all sides so cells clear the tab
 * switcher above them, and packed to the start (`justify-content`) so tracks
 * flow left-to-right at their intrinsic size rather than stretching to fill.
 */
export const grid = style({
  justifyContent: 'start',
  padding: space[4],
});

/**
 * `grid-template-columns` by total track count. Tracks are sized to their widest
 * cell (`max-content`) so every cell aligns down its column, dynamic variants
 * stay aligned, and cells never shrink below their content (no wrapping when the
 * viewport is constrained). The count is dynamic — a header column plus one per
 * axis entry — so it's selected here rather than expressed as a single rule.
 */
export const templateColumns = styleVariants(
  { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
  (count) => ({ gridTemplateColumns: `repeat(${count}, max-content)` }),
);
