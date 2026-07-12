import type { FloatingAlignment, FloatingSide } from '../../floating-ui';
import { contains, inset, overlapArea, place } from '../geometry';
import type { TetherPlugin } from '../pipeline';

/**
 * Placement preferences with fallbacks, modeled on CSS
 * `position-try-fallbacks`: the requested placement is tried first,
 * then each fallback in order, and the first candidate that fits the
 * padded viewport wins.
 *
 * Deviations from the CSS behavior, both for stability:
 * - Memory. The placement currently painted keeps priority while it
 *   still fits, so a surface that fell back doesn't snap home the
 *   instant the preferred spot reopens — scroll can't make it
 *   flip-flop across a boundary.
 * - When nothing fits, the candidate showing the largest visible area
 *   wins (CSS reverts to the requested placement even when a fallback
 *   would show more).
 */

/** One fallback placement in the preference order. */
export interface PositionTryFallback {
  /** Edge of the anchor the fallback binds to. */
  side: FloatingSide;
  /** Alignment along that edge. Defaults to the requested alignment. */
  align?: FloatingAlignment;
}

/**
 * Build the position-try plugin from an ordered fallback list. An
 * empty list pins the surface to its requested placement.
 */
export const positionTry =
  (fallbacks: readonly PositionTryFallback[]): TetherPlugin =>
  (state, decisions) => {
    const { rects, placement, applied } = state;
    const bounds = inset(rects.viewport, state.padding);

    const candidates = [
      { side: decisions.side, align: decisions.align },
      ...fallbacks.map((fallback) => ({
        side: fallback.side,
        align: fallback.align ?? decisions.align,
      })),
    ];

    // Memory: the placement already on screen jumps the queue, so it
    // holds as long as it fits.
    const painted = candidates.findIndex(
      (candidate) =>
        candidate.side === applied.side && candidate.align === applied.align,
    );
    if (painted > 0) candidates.unshift(...candidates.splice(painted, 1));

    const placedAt = (candidate: (typeof candidates)[number]) =>
      place(rects.anchor, rects.popup, { ...placement, ...candidate });

    const chosen =
      candidates.find((candidate) => contains(bounds, placedAt(candidate))) ??
      candidates.reduce((best, candidate) =>
        overlapArea(bounds, placedAt(candidate)) >
        overlapArea(bounds, placedAt(best))
          ? candidate
          : best,
      );

    return { ...decisions, side: chosen.side, align: chosen.align };
  };
