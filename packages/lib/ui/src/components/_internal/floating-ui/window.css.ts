import {
  createVar,
  fallbackVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import { radius } from '@lib/design';
import {
  offset,
  translateX as arrowX,
  translateY as arrowY,
} from './arrow.css';

/**
 * Gap between the anchor edge and the window, in px. Assigned inline
 * by the window from its `sideOffset` prop; unset falls back to `0`.
 */
export const sideOffset = createVar();

/**
 * Nudge along the bound edge, in px. Assigned inline by the window
 * from its `alignOffset` prop. Positive values push a `start`-aligned
 * window toward `end` and an `end`-aligned window toward `start` — the
 * same logical inversion Radix applies, so flipping alignment never
 * flips the offset's sign. A centered window ignores it, as Radix does.
 */
export const alignOffset = createVar();

/**
 * Point-mode coordinates, in px from the anchor's top-left corner.
 * Assigned inline by the window from its `point` prop and only read
 * under `data-point`, which is also where they're zeroed.
 */
export const pointX = createVar();
export const pointY = createVar();

/**
 * Measured position of the window, in px from the root's top-left
 * corner. Assigned inline by the window from the tether's measurement
 * and only read under `data-tethered`, which is also where they're
 * zeroed.
 */
export const tetherX = createVar();
export const tetherY = createVar();

// The corner of the window that faces whatever it's bound to, as a
// percentage of its own size. Doubles as the `transform-origin` — the
// point a scale animation should grow out of is the same corner.
// Unset halves resolve to center.
const originX = createVar();
const originY = createVar();

// Which way the window grows along each axis: `-1` back toward the
// negative end (up/left), `1` forward. Only the backward placements
// assign it; unset means forward.
const signX = createVar();
const signY = createVar();

// How far the window travels along each axis before the sign is
// applied. Assigned by `data-axis`, which is what decides whether a
// given axis is the one facing the anchor or the one running along its
// edge.
const distanceX = createVar();
const distanceY = createVar();

const gap = fallbackVar(sideOffset, '0px');
const nudge = fallbackVar(alignOffset, '0px');

/**
 * Displacement along one axis: pull the window back by the corner
 * facing its binding, then travel `distance` in the growth direction.
 *
 * Everything the placement does reduces to this. The rules below bind
 * an edge of the window to an edge of the anchor (or to a point) with
 * a plain percentage inset, and this expression walks it from there —
 * so a rule only has to name its corner, its direction, and how far.
 */
const shift = (origin: string, sign: string, distance: string) =>
  `calc(-1 * ${fallbackVar(origin, '50%')} + ${fallbackVar(distance, '0px')} * ${fallbackVar(sign, '1')})`;

/**
 * The positioned floating window.
 *
 * Placement is one unconditional translation. `data-side` and
 * `data-align` never position the window themselves — each binds one
 * axis by pinning `top`/`left` to a percentage of the anchor box, then
 * declares the three inputs {@link shift} needs for that axis. `side`
 * owns the axis facing the anchor, `align` the axis running along the
 * edge, so between them both axes are always fully described.
 *
 * `data-axis` names the axis `side` owns — `y` for top/bottom, `x` for
 * left/right. Most rules here care only about that, not about which of
 * the two sides it is, and selecting on the axis says so outright
 * instead of pairing sides up in every selector.
 *
 * Edge mode (default): `data-side` places the window fully outside the
 * chosen edge of the anchor and `data-align` positions it along that
 * edge — `start` hugs the top/left, `end` the bottom/right.
 * {@link sideOffset} opens a gap off the edge; {@link alignOffset}
 * nudges along it, except for a centered window, which ignores it. That
 * last rule is floating-ui's (`offset` applies `alignmentAxis` only to
 * `start`/`end` placements), adopted so the two modes never disagree.
 *
 * Point mode (`data-point`): the window binds to a coordinate inside the
 * anchor box instead of an edge, so only the pins change — the
 * translation already describes which way the window grows and how far
 * the offsets displace it. The point is clamped to the box, as the
 * tether's virtual reference clamps it, so an anchor that shrinks under
 * a point never leaves the window hanging outside.
 *
 * Each mode's vars are declared where they're read. Custom properties
 * inherit, so a var left undeclared on a window would come from the
 * nearest float above it; declaring the mode's zeros under the mode's
 * own attribute keeps nested floats independent without a base style
 * that carries every var on every window.
 *
 * Tethered (`data-tethered`): a measurement has landed, and the window
 * sits exactly where it says. The pins collapse to the root's corner and
 * the translation becomes the measured coordinates verbatim; the
 * placement rules above still run but only feed `flex-direction` and
 * `transform-origin`. Given room, the measured coordinates equal what
 * the pins produce, so flipping the attribute moves nothing.
 *
 * Placement rides on `translate` rather than `transform`, which leaves
 * `transform` entirely to consumers: a scale-in animation composes with
 * the placement instead of overwriting it.
 *
 * A flexbox lays out the arrow and body. Each side sets its own
 * `flex-direction`, which seats the DOM-first arrow onto the edge facing
 * the anchor (reversed for top/left).
 *
 * The box itself is transparent to the pointer: it spans the arrow's
 * whole row, most of which is empty, and it sits over the anchor
 * outright in point mode. Only the body takes pointer events back (see
 * `body.css`).
 *
 * Every selector is wrapped in `:where(...)` so all rules hold equal
 * specificity and the cascade resolves by source order — the point-mode
 * pins override the edge-mode ones, and the tethered rule, last of all,
 * overrides both.
 */
export const window = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'none',
  transformOrigin: `${fallbackVar(originX, '50%')} ${fallbackVar(originY, '50%')}`,
  translate: `${shift(originX, signX, distanceX)} ${shift(originY, signY, distanceY)}`,
  selectors: {
    // Which offset runs along which axis. The side offset always travels
    // on the axis facing the anchor, the align offset on the axis
    // running along the edge — `data-axis` names the former.
    '&:where([data-axis="y"])': {
      vars: { [distanceX]: nudge, [distanceY]: gap },
    },
    '&:where([data-axis="x"])': {
      vars: { [distanceX]: gap, [distanceY]: nudge },
    },

    // Pin the window's anchor-facing edge to the anchor edge it sits
    // outside of, and orient the arrow-first axis so the arrow lands on
    // that same edge.
    '&:where([data-side="top"])': {
      top: 0,
      flexDirection: 'column-reverse',
      vars: { [originY]: '100%', [signY]: '-1' },
    },
    '&:where([data-side="bottom"])': {
      top: '100%',
      flexDirection: 'column',
      vars: { [originY]: '0%' },
    },
    '&:where([data-side="left"])': {
      left: 0,
      flexDirection: 'row-reverse',
      vars: { [originX]: '100%', [signX]: '-1' },
    },
    '&:where([data-side="right"])': {
      left: '100%',
      flexDirection: 'row',
      vars: { [originX]: '0%' },
    },

    // Align across a horizontal edge: start=left … end=right.
    '&:where([data-axis="y"][data-align="start"])': {
      left: 0,
      vars: { [originX]: '0%' },
    },
    '&:where([data-axis="y"][data-align="center"])': {
      left: '50%',
      vars: { [distanceX]: '0px' },
    },
    '&:where([data-axis="y"][data-align="end"])': {
      left: '100%',
      vars: { [originX]: '100%', [signX]: '-1' },
    },

    // Align across a vertical edge: start=top … end=bottom.
    '&:where([data-axis="x"][data-align="start"])': {
      top: 0,
      vars: { [originY]: '0%' },
    },
    '&:where([data-axis="x"][data-align="center"])': {
      top: '50%',
      vars: { [distanceY]: '0px' },
    },
    '&:where([data-axis="x"][data-align="end"])': {
      top: '100%',
      vars: { [originY]: '100%', [signY]: '-1' },
    },

    // --- Point mode ---
    // Repin both axes to the point. Declared after the edge rules so it
    // wins on source order; the translation needs no adjustment.
    '&:where([data-point])': {
      vars: { [pointX]: '0px', [pointY]: '0px' },
      top: `clamp(0px, ${pointY}, 100%)`,
      left: `clamp(0px, ${pointX}, 100%)`,
    },

    // --- Tethered ---
    // Drop the pins and the calc; the measurement already accounts for
    // side, alignment, both offsets, and the point. The arrow's seat is
    // zeroed here too: the arrow reads it only under this attribute.
    '&:where([data-tethered])': {
      vars: {
        [tetherX]: '0px',
        [tetherY]: '0px',
        [arrowX]: '0px',
        [arrowY]: '0px',
      },
      top: 0,
      left: 0,
      translate: `${tetherX} ${tetherY}`,
    },
  },
});

/**
 * Maps the surface radius to the arrow's corner offset. The straight run
 * of a rounded edge begins exactly one radius in from the corner, so a
 * start/end-aligned arrow clears the curve when nudged by that same
 * distance — the offset is the radius value verbatim.
 *
 * Lands on the window rather than the body: the arrow is the window's
 * child, so the var has to be set on an ancestor it can read.
 */
export const arrowRadiusOffset = styleVariants(radius, (value) => ({
  vars: { [offset]: value },
}));
