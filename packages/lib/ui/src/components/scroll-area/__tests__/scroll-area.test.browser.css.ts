/**
 * Layout fixtures for `scroll-area.test.browser.tsx`. The
 * scrollbars derive from live measurements, so the surrounding
 * frame and the inner content need real pixel dimensions for
 * overflow to materialize. Static styles belong in vanilla-extract,
 * not inline `style={{}}` blocks.
 */

import { style } from '@vanilla-extract/css';

/** Fixed-size frame so overflow is a function of `children` alone. */
export const frame = style({
  width: '200px',
  height: '200px',
});

/** Block much taller and wider than the frame to force overflow. */
export const overflow = style({
  width: '600px',
  height: '600px',
});

/** Adds a non-zero min-height to a wrapper so the test can assert
 * consumer-supplied inline styles land on the root. */
export const consumerMinHeight = style({
  minHeight: '50px',
});
