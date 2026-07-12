import { availableOnSide, isVerticalSide } from '../geometry';
import type { TetherPlugin } from '../pipeline';

/**
 * Publish how much room the surface may occupy at its resolved
 * placement: the gap between the anchor and the viewport edge on the
 * bound side, and the padded viewport span on the cross axis. Rides
 * out as `--available-width`/`--available-height` so consumers can cap
 * themselves and scroll instead of clipping.
 */
export const size: TetherPlugin = (state, decisions) => {
  const main = availableOnSide(
    state.anchor,
    state.viewport,
    decisions.side,
    state.placement.sideOffset,
    state.padding,
  );
  const cross = isVerticalSide(decisions.side)
    ? state.viewport.width - state.padding * 2
    : state.viewport.height - state.padding * 2;

  const [availableWidth, availableHeight] = isVerticalSide(decisions.side)
    ? [cross, main]
    : [main, cross];

  return {
    ...decisions,
    availableWidth: Math.max(0, availableWidth),
    availableHeight: Math.max(0, availableHeight),
    anchorWidth: state.anchor.width,
    anchorHeight: state.anchor.height,
  };
};
