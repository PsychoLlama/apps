/**
 * Fixtures for the browser tests. The pointer here is a real one, and
 * it stays where the last test left it, so the tests need somewhere to
 * put it that no tooltip will ever be under: `park` is that, and
 * `stage` keeps the fixtures out of its way.
 */

import { style } from '@vanilla-extract/css';

/**
 * Fills the viewport, under everything. Hovering it puts the pointer in
 * the middle of the screen, which is nowhere near the stage.
 */
export const park = style({
  position: 'fixed',
  inset: 0,
});

/**
 * Holds whatever a test renders, pinned to the top right corner. Away
 * from the parked pointer, and away from the origin, where the pointer
 * starts before it has ever moved. It paints over `park` on tree order
 * alone: both are positioned, and the stage is rendered into the
 * document after it.
 */
export const stage = style({
  position: 'fixed',
  top: 0,
  right: 0,
});

/**
 * The opposite corner, for something a test needs to press without the
 * open tooltip lying over it.
 */
export const outside = style({
  position: 'fixed',
  bottom: 0,
  left: 0,
});

/** A short box that scrolls. */
export const scroller = style({
  height: '100px',
  overflow: 'auto',
});

/** Tall enough to give the scroller somewhere to go. */
export const filler = style({
  height: '400px',
});
