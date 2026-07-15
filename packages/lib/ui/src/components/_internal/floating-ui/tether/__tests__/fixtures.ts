/**
 * Shared fixtures for the tether's pure-core tests. Every plugin is a
 * pure function over plain rects, so each suite stands up the same
 * measured world — a centered anchor in a roomy viewport — and tweaks
 * only the boxes its case cares about.
 */

import type { TetherRect } from '../geometry';
import type { TetherRects, TetherState } from '../pipeline';

export type { TetherRect, TetherRects, TetherState };

/** Build a rect from left/top/width/height. */
export const rect = (
  left: number,
  top: number,
  width: number,
  height: number,
): TetherRect => ({ x: left, y: top, width, height });

/** A 100×100 anchor centered in a 1000×1000 viewport, 200×100 popup. */
export const state = (
  overrides: Partial<Omit<TetherState, 'rects'>> & {
    rects?: Partial<TetherRects>;
  } = {},
): TetherState => ({
  placement: { side: 'bottom', align: 'center', sideOffset: 0, alignOffset: 0 },
  padding: 0,
  ...overrides,
  rects: {
    anchor: rect(450, 450, 100, 100),
    popup: rect(400, 550, 200, 100),
    viewport: rect(0, 0, 1000, 1000),
    ...overrides.rects,
  },
});
