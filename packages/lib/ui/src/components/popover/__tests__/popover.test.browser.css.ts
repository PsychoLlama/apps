/** Fixtures for the browser tests. */

import { style } from '@vanilla-extract/css';

/**
 * The bottom right corner, for something a test needs to press without
 * the open popover, which hangs below its trigger, lying over it.
 */
export const outside = style({
  position: 'fixed',
  bottom: 0,
  right: 0,
});
