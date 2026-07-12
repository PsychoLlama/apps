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

/** Fixed-size surface so expected positions are exact. */
export const surface = style({
  width: '80px',
  height: '40px',
});

/** Pins an anchor flush against the viewport's bottom edge. */
export const pinBottom = style({
  position: 'fixed',
  bottom: 0,
  left: '200px',
});

/** Pins an anchor flush against the viewport's left edge. */
export const pinLeft = style({
  position: 'fixed',
  left: 0,
  top: '200px',
});

/** A surface wider than the 100px anchor, so centering overflows. */
export const wideSurface = style({
  width: '300px',
  height: '40px',
});

/** Scrollable stage for exercising scroll-driven tether updates. */
export const scrollStage = style({
  position: 'fixed',
  inset: 0,
  overflow: 'auto',
});

/** Tall runway centering the anchor with generous room either side. */
export const runway = style({
  height: '300vh',
  display: 'grid',
  placeItems: 'center',
});
