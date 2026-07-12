import { centerX, centerY, clamp, isVerticalSide, place } from '../geometry';
import type { TetherPlugin } from '../pipeline';

/**
 * Center the arrow over the anchor. The arrow's CSS seat (its
 * align-self position plus any radius offset) is measured, normalized
 * back to rest by subtracting the previously applied nudge, and the
 * delta to the anchor's midpoint rides out as a translation — clamped
 * so the arrow never slides off the surface, and hidden entirely when
 * the anchor's midpoint isn't over the surface at all (a shifted or
 * detach-limited surface can leave it behind).
 *
 * Measurements are only trustworthy while the surface is rendered at
 * the placement this run resolved; after a flip the seat is stale, so
 * the plugin holds the identity nudge and the runner schedules a
 * follow-up pass once the new placement paints.
 */
export const arrow: TetherPlugin = (state, decisions) => {
  const { rects } = state;
  if (!rects.arrow) return decisions;

  if (
    state.applied.side !== decisions.side ||
    state.applied.align !== decisions.align
  ) {
    return { ...decisions, arrowShiftX: 0, arrowShiftY: 0 };
  }

  const vertical = isVerticalSide(decisions.side);
  const placed = place(rects.anchor, rects.popup, {
    ...state.placement,
    side: decisions.side,
    align: decisions.align,
  });

  // Everything below runs on the cross axis — the edge the arrow
  // slides along. Positions are taken relative to the measured popup
  // so previously applied container shifts cancel out.
  const anchorCenter = vertical ? centerX(rects.anchor) : centerY(rects.anchor);
  const popupStart = vertical
    ? placed.x + decisions.shiftX
    : placed.y + decisions.shiftY;
  const popupSize = vertical ? placed.width : placed.height;
  const measuredPopupStart = vertical ? rects.popup.x : rects.popup.y;
  const arrowCenter = vertical ? centerX(rects.arrow) : centerY(rects.arrow);
  const arrowSize = vertical ? rects.arrow.width : rects.arrow.height;
  const appliedShift = vertical
    ? state.applied.arrowShiftX
    : state.applied.arrowShiftY;

  // Where the arrow's midpoint rests within the surface, seat only.
  const restCenter = arrowCenter - appliedShift - measuredPopupStart;

  const hidden =
    anchorCenter < popupStart || anchorCenter > popupStart + popupSize;

  // Aim at the anchor's midpoint, but keep the arrow's base fully on
  // the surface's straight run.
  const target = clamp(
    anchorCenter - popupStart,
    arrowSize / 2,
    popupSize - arrowSize / 2,
  );
  const nudge = target - restCenter;

  return vertical
    ? { ...decisions, arrowShiftX: nudge, arrowHidden: hidden }
    : { ...decisions, arrowShiftY: nudge, arrowHidden: hidden };
};
