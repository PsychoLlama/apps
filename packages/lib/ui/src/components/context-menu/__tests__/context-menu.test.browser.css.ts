/** Fixtures for the browser tests. */

import { style } from '@vanilla-extract/css';

/**
 * A fixed area with room around it, so a menu opened at a point inside
 * lands where the point says rather than flipping or shifting.
 */
export const area = style({
  width: '20rem',
  height: '20rem',
});

/**
 * The bottom right corner, for something a test needs to press without
 * the open menu lying over it.
 */
export const outside = style({
  position: 'fixed',
  bottom: 0,
  right: 0,
});
