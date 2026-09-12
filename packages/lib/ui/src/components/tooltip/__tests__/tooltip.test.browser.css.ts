/**
 * Fixtures for the browser tests. A scroll container the trigger sits
 * in, so scrolling it moves the trigger out from under its window.
 */

import { style } from '@vanilla-extract/css';

/** A short box that scrolls. */
export const scroller = style({
  height: '100px',
  overflow: 'auto',
});

/** Tall enough to give the scroller somewhere to go. */
export const filler = style({
  height: '400px',
});
