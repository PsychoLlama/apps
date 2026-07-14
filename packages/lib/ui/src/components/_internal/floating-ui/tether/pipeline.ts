import type { FloatingAlignment, FloatingSide } from '../floating-ui';
import type { TetherPlacement, TetherRect } from './geometry';

/**
 * The tether's decision pipeline. Plugins are pure functions folded
 * left over an accumulating decision record: each one reads the
 * measured state plus every decision made so far and returns the
 * accumulator with its own decisions layered in. The runner owns
 * nothing else — observation and DOM application live in
 * `create-tether`.
 */

/** The boxes a pipeline run measures, in viewport coordinates. */
export interface TetherRects {
  /** The anchor element's box. */
  anchor: TetherRect;
  /** The floating container's box. Only its size is trustworthy — its
   * position reflects previously applied decisions. */
  popup: TetherRect;
  /** The visual viewport. */
  viewport: TetherRect;
}

/**
 * Everything a plugin may read: the requested (pre-decision)
 * placement and the boxes measured in the same frame.
 */
export interface TetherState {
  /** Requested placement before any collision decisions. */
  placement: TetherPlacement;
  /** The measured boxes placement decisions run against. */
  rects: TetherRects;
  /** Minimum clearance to keep between the surface and the viewport
   * edge when resolving placement. */
  padding: number;
}

/**
 * The accumulated output of a pipeline run. Every field maps onto one
 * of the container's override channels — data attributes or CSS var
 * slots — and starts from an identity value, so an empty pipeline
 * reproduces the pure-CSS placement untouched.
 */
export interface TetherDecisions {
  /** Resolved edge after collision handling. */
  side: FloatingSide;
  /** Resolved alignment after collision handling. */
  align: FloatingAlignment;
}

/** A single pure step in the decision fold. */
export type TetherPlugin = (
  state: TetherState,
  decisions: TetherDecisions,
) => TetherDecisions;

/** The identity decisions: reproduce the pure-CSS placement as-is. */
export const initialDecisions = (
  placement: TetherPlacement,
): TetherDecisions => ({
  side: placement.side,
  align: placement.align,
});

/** Fold the plugin list left over the accumulating decisions. */
export const runTether = (
  state: TetherState,
  plugins: readonly TetherPlugin[],
): TetherDecisions =>
  plugins.reduce(
    (decisions, plugin) => plugin(state, decisions),
    initialDecisions(state.placement),
  );
