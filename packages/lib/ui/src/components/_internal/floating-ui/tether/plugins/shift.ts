import { bottomOf, clamp, isVerticalSide, place, rightOf } from '../geometry';
import type { TetherPlugin } from '../pipeline';

/**
 * Slide the surface along its bound edge to keep it inside the
 * viewport, limited so it never detaches from the anchor — the shift
 * stops once the surface's near edge reaches the anchor's far edge
 * (Radix's `sticky: 'partial'` limiter). The side axis is the flip
 * plugin's job; this only ever moves along the cross axis.
 */
export const shift: TetherPlugin = (state, decisions) => {
  const placed = place(state.anchor, state.popup, {
    ...state.placement,
    side: decisions.side,
    align: decisions.align,
  });

  const vertical = isVerticalSide(decisions.side);
  const start = vertical ? placed.x : placed.y;
  const size = vertical ? placed.width : placed.height;
  const viewportStart =
    (vertical ? state.viewport.x : state.viewport.y) + state.padding;
  const viewportEnd =
    (vertical ? rightOf(state.viewport) : bottomOf(state.viewport)) -
    state.padding;
  const anchorStart = vertical ? state.anchor.x : state.anchor.y;
  const anchorSize = vertical ? state.anchor.width : state.anchor.height;

  // The raw correction that would pin the surface inside the viewport.
  // When it can't fit both edges, honoring the start edge wins.
  const overflowStart = viewportStart - start;
  const overflowEnd = start + size - viewportEnd;
  const raw =
    overflowStart > 0 ? overflowStart : overflowEnd > 0 ? -overflowEnd : 0;

  if (raw === 0) return decisions;

  // Detachment limits: the surface may slide until its near edge meets
  // the anchor's far edge, but no further in either direction.
  const min = anchorStart - (start + size);
  const max = anchorStart + anchorSize - start;
  const limited = clamp(raw, min, max);

  return vertical
    ? { ...decisions, shiftX: decisions.shiftX + limited }
    : { ...decisions, shiftY: decisions.shiftY + limited };
};
