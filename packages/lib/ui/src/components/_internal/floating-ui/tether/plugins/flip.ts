import {
  OPPOSITE_SIDE,
  availableOnSide,
  isVerticalSide,
  place,
} from '../geometry';
import type { TetherPlugin } from '../pipeline';

/**
 * Flip to the opposite edge when the surface overflows the viewport on
 * its bound side and the opposite side has more room. Overflow alone
 * isn't enough — a surface taller than both gaps stays put rather than
 * thrashing between two sides that each clip it.
 */
export const flip: TetherPlugin = (state, decisions) => {
  const placed = place(state.anchor, state.popup, {
    ...state.placement,
    side: decisions.side,
    align: decisions.align,
  });

  const overflow = isVerticalSide(decisions.side)
    ? decisions.side === 'top'
      ? state.viewport.y + state.padding - placed.y
      : placed.y +
        placed.height -
        (state.viewport.y + state.viewport.height - state.padding)
    : decisions.side === 'left'
      ? state.viewport.x + state.padding - placed.x
      : placed.x +
        placed.width -
        (state.viewport.x + state.viewport.width - state.padding);

  if (overflow <= 0) return decisions;

  const opposite = OPPOSITE_SIDE[decisions.side];
  const room = (side: typeof opposite) =>
    availableOnSide(
      state.anchor,
      state.viewport,
      side,
      state.placement.sideOffset,
      state.padding,
    );

  return room(opposite) > room(decisions.side)
    ? { ...decisions, side: opposite }
    : decisions;
};
