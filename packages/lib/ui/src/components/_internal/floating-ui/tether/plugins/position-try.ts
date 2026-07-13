import type { FloatingAlignment, FloatingSide } from '../../floating-ui';
import { contains, inset, overlapArea, place } from '../geometry';
import type { TetherPlugin } from '../pipeline';

/**
 * Placement preferences with fallbacks, modeled on CSS
 * `position-try-fallbacks`: the requested placement is tried first,
 * then each fallback in order, and the first candidate that fits the
 * padded viewport wins.
 *
 * Deviation from the CSS behavior: when nothing fits, the candidate
 * showing the largest visible area wins (CSS reverts to the requested
 * placement even when a fallback would show more).
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
    const { rects, placement } = state;
    const bounds = inset(rects.viewport, state.padding);

    const candidates = [
      { side: decisions.side, align: decisions.align },
      ...fallbacks.map((fallback) => ({
        side: fallback.side,
        align: fallback.align ?? decisions.align,
      })),
    ];

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
