import type { FloatingAlignment, FloatingSide } from '../floating-ui';
import type { TetherPlacement, TetherRect } from './geometry';

/**
 * The tether's decision pipeline. Plugins are pure functions folded
 * left over an accumulating decision record: each one reads the
 * measured state plus every decision made so far (the arrow plugin
 * sees the side the flip plugin chose) and returns the accumulator
 * with its own decisions layered in. The runner owns nothing else —
 * observation and DOM application live in `create-tether`.
 */

/**
 * Everything a plugin may read. Rects are viewport-coordinate
 * measurements taken in the same frame; `placement` is the requested
 * (pre-decision) placement.
 */
export interface TetherState {
  /** Requested placement before any collision decisions. */
  placement: TetherPlacement;
  /** The anchor element's box. */
  anchor: TetherRect;
  /** The floating container's box. Only its size is trustworthy — its
   * position reflects previously applied decisions. */
  popup: TetherRect;
  /** The popup's positioning context (`offsetParent` of the anchor). */
  parent: TetherRect;
  /** The visual viewport. */
  viewport: TetherRect;
  /** The arrow's box, or `null` when no arrow is rendered. Position
   * reflects previously applied decisions; see {@link applied}. */
  arrow: TetherRect | null;
  /** Minimum clearance to keep between the surface and the viewport
   * edge when flipping, shifting, and sizing. */
  padding: number;
  /**
   * The decisions in effect when the rects were measured, so plugins
   * can normalize their own prior output back out of a measurement.
   */
  applied: AppliedDecisions;
}

/** The slice of prior decisions that contaminates measurements. */
export interface AppliedDecisions {
  side: FloatingSide;
  align: FloatingAlignment;
  arrowShiftX: number;
  arrowShiftY: number;
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
  /** Translation applied on top of the CSS placement, in px. */
  shiftX: number;
  shiftY: number;
  /** Space the surface may occupy before hitting the viewport, in px.
   * `null` leaves the var unset. */
  availableWidth: number | null;
  availableHeight: number | null;
  /** The anchor's measured size, for surfaces that match it, in px.
   * `null` leaves the var unset. */
  anchorWidth: number | null;
  anchorHeight: number | null;
  /** Nudge centering the arrow over the anchor, in px. */
  arrowShiftX: number;
  arrowShiftY: number;
  /** Whether the arrow should hide because it can't reach the anchor. */
  arrowHidden: boolean;
  /** Scale-animation origin, or `null` for the CSS default. */
  transformOrigin: string | null;
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
  shiftX: 0,
  shiftY: 0,
  availableWidth: null,
  availableHeight: null,
  anchorWidth: null,
  anchorHeight: null,
  arrowShiftX: 0,
  arrowShiftY: 0,
  arrowHidden: false,
  transformOrigin: null,
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
