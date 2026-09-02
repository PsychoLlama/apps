/**
 * Layout fixtures for `floating-ui.test.browser.tsx`. Placement math
 * needs real pixel dimensions, so the anchor and surface get fixed
 * sizes. Static styles belong in vanilla-extract, not inline
 * `style={{}}` blocks.
 */

import { style } from '@vanilla-extract/css';

/**
 * Fixed stage that centers the anchor away from the viewport edges so
 * a surface can float off any side without clipping the measurement.
 */
export const stage = style({
  width: '400px',
  height: '400px',
  display: 'grid',
  placeItems: 'center',
});

/** Fixed-size anchor box so expected positions are exact. */
export const anchorBox = style({
  width: '100px',
  height: '100px',
});

/**
 * A bordered anchor. The border is the entire point of the fixture: it's
 * what drives the box the CSS placement resolves against (its ancestor's
 * padding box) and the border box a measured placement reads apart,
 * unless the root collapses the two onto each other.
 */
export const borderedAnchorBox = style({
  width: '100px',
  height: '100px',
  boxSizing: 'border-box',
  border: '4px solid',
});

/** Fixed-size surface so expected positions are exact. */
export const surface = style({
  width: '80px',
  height: '40px',
});
