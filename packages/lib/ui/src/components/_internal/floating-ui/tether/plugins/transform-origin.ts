import { centerX, centerY, clamp, isVerticalSide, place } from '../geometry';
import type { TetherPlugin } from '../pipeline';

/**
 * Aim the scale-animation origin at the anchor: the point on the
 * surface's anchor-facing edge nearest the anchor's midpoint, after
 * every placement decision so far. Overrides the side/align-derived
 * CSS default so a flipped or shifted surface still grows out of the
 * thing that spawned it.
 */
export const transformOrigin: TetherPlugin = (state, decisions) => {
  const { anchor, popup } = state.rects;
  const vertical = isVerticalSide(decisions.side);
  const placed = place(anchor, popup, {
    ...state.placement,
    side: decisions.side,
    align: decisions.align,
  });

  const anchorCenter = vertical ? centerX(anchor) : centerY(anchor);
  const start = vertical
    ? placed.x + decisions.shiftX
    : placed.y + decisions.shiftY;
  const size = vertical ? placed.width : placed.height;
  const cross = clamp(anchorCenter - start, 0, size);

  // The facing edge: the surface's edge nearest the anchor.
  const facing =
    decisions.side === 'top' || decisions.side === 'left' ? '100%' : '0%';

  return {
    ...decisions,
    transformOrigin: vertical ? `${cross}px ${facing}` : `${facing} ${cross}px`,
  };
};
