import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';

/**
 * Manifest cards in an equal-width grid. `auto-fit` + `minmax` keeps every
 * card the same width and collapses to a single full-width column once the
 * cards can no longer fit their minimum, so it reflows cleanly on mobile.
 */
export const grid = style({
  marginTop: space[6],
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(16rem, 100%), 1fr))',
});

/** Fill the grid cell so cards sharing a row stay the same height. */
export const card = style({
  height: '100%',
});
