import {
  createVar,
  fallbackVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import { radius } from '@lib/design';
import { offset } from './arrow.css';

/**
 * Anchor target — establishes the positioning context an absolutely
 * positioned floating surface resolves against. Apply to whatever
 * element a floating primitive should anchor to.
 */
export const anchor = style({
  position: 'relative',
});

/**
 * Gap between the anchor edge and the surface, in px. Assigned inline
 * by the container from its `sideOffset` prop; unset falls back to `0`.
 */
export const sideOffset = createVar();

/**
 * Nudge along the bound edge, in px. Assigned inline by the container
 * from its `alignOffset` prop. Positive values push a `start`-aligned
 * surface toward `end`, an `end`-aligned surface toward `start`, and a
 * centered surface toward `end` — the same logical inversion Radix
 * applies, so flipping alignment never flips the offset's sign.
 */
export const alignOffset = createVar();

/**
 * Point-mode coordinates, in px from the anchor's top-left corner.
 * Assigned inline by the container from its `point` prop.
 */
export const pointX = createVar();
export const pointY = createVar();

/**
 * Override slot for the container's `transform-origin`. Unset, the
 * origin derives from `data-side`/`data-align` so scale animations grow
 * out of the anchor-facing edge. The tether assigns this var to aim the
 * origin at the anchor's exact position after collision adjustments.
 */
export const transformOrigin = createVar();

/**
 * Override slots: a pixel translation applied on top of the CSS
 * placement, one var per axis. The tether assigns these to slide the
 * surface back into the viewport; unset they fall back to `0`.
 */
export const shiftX = createVar();
export const shiftY = createVar();

/**
 * Consumer contract: how much room the surface has before hitting the
 * viewport, assigned by the tether when active. Surfaces that scroll
 * instead of clipping cap themselves with these (e.g.
 * `max-height: var(--available-height)`); unset means unknown, so pair
 * every read with a fallback.
 */
export const availableWidth = createVar();
export const availableHeight = createVar();

/**
 * Consumer contract: the anchor's measured size, assigned by the
 * tether when active. For surfaces that match their anchor's width
 * (e.g. a select menu spanning its trigger). Unset means unknown.
 */
export const anchorWidth = createVar();
export const anchorHeight = createVar();

// Composition channels for the side/align-derived transform origin.
// Side rules assign the axis facing the anchor; align rules assign the
// axis running along the edge; unset halves resolve to center.
const originX = createVar();
const originY = createVar();

// Point-mode translation, composed from side (anchor-facing axis,
// including the side offset) and align (edge axis, including the align
// offset) by the selectors below.
const pointShiftX = createVar();
const pointShiftY = createVar();

const gap = fallbackVar(sideOffset, '0px');
const nudge = fallbackVar(alignOffset, '0px');

/**
 * Positioning shell for the floating surface.
 *
 * Edge mode (default): `data-side` places it fully outside the chosen
 * edge of the anchor and `data-align` positions it along that edge —
 * `start` hugs the top/left, `end` the bottom/right. {@link sideOffset}
 * opens a gap off the edge; {@link alignOffset} nudges along it.
 *
 * Point mode (`data-point`): the surface binds to a coordinate inside
 * the anchor box instead of an edge. `data-side`/`data-align` then
 * describe which way the surface grows from that point, and the offsets
 * displace it from the point the same way they displace it from an edge.
 *
 * A flexbox lays out the arrow and body. Each side sets its own
 * `flex-direction`, which seats the DOM-first arrow onto the edge facing
 * the anchor (reversed for top/left).
 *
 * Every selector is wrapped in `:where(...)` so all rules hold equal
 * specificity and the cascade resolves by source order — the point-mode
 * block sits last so it can override any edge-mode positioning.
 */
export const container = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  translate: `${fallbackVar(shiftX, '0px')} ${fallbackVar(shiftY, '0px')}`,
  transformOrigin: fallbackVar(
    transformOrigin,
    `${fallbackVar(originX, '50%')} ${fallbackVar(originY, '50%')}`,
  ),
  selectors: {
    // Push fully outside the chosen edge, and orient the arrow-first
    // axis so the arrow lands on the anchor-facing edge. The margin
    // opens the side-offset gap; the origin faces back at the anchor.
    '&:where([data-side="top"])': {
      bottom: '100%',
      marginBottom: gap,
      flexDirection: 'column-reverse',
      vars: { [originY]: '100%' },
    },
    '&:where([data-side="bottom"])': {
      top: '100%',
      marginTop: gap,
      flexDirection: 'column',
      vars: { [originY]: '0%' },
    },
    '&:where([data-side="left"])': {
      right: '100%',
      marginRight: gap,
      flexDirection: 'row-reverse',
      vars: { [originX]: '100%' },
    },
    '&:where([data-side="right"])': {
      left: '100%',
      marginLeft: gap,
      flexDirection: 'row',
      vars: { [originX]: '0%' },
    },

    // Align along a horizontal edge (top/bottom): start=left … end=right.
    '&:where([data-side="top"][data-align="start"], [data-side="bottom"][data-align="start"])':
      {
        left: 0,
        marginLeft: nudge,
        vars: { [originX]: '0%' },
      },

    '&:where([data-side="top"][data-align="center"], [data-side="bottom"][data-align="center"])':
      {
        left: '50%',
        transform: `translateX(calc(-50% + ${nudge}))`,
      },

    '&:where([data-side="top"][data-align="end"], [data-side="bottom"][data-align="end"])':
      {
        right: 0,
        marginRight: nudge,
        vars: { [originX]: '100%' },
      },

    // Align along a vertical edge (left/right): start=top … end=bottom.
    '&:where([data-side="left"][data-align="start"], [data-side="right"][data-align="start"])':
      {
        top: 0,
        marginTop: nudge,
        vars: { [originY]: '0%' },
      },

    '&:where([data-side="left"][data-align="center"], [data-side="right"][data-align="center"])':
      {
        top: '50%',
        transform: `translateY(calc(-50% + ${nudge}))`,
      },

    '&:where([data-side="left"][data-align="end"], [data-side="right"][data-align="end"])':
      {
        bottom: 0,
        marginBottom: nudge,
        vars: { [originY]: '100%' },
      },

    // --- Point mode ---
    // Bind the surface's reference corner to the point, then translate
    // it so side/align describe the growth direction. Margins can't
    // displace a top/left-bound box, so the offsets fold into the
    // translation instead. Declared after the edge rules so it wins on
    // source order.
    '&:where([data-point])': {
      top: fallbackVar(pointY, '0px'),
      left: fallbackVar(pointX, '0px'),
      right: 'auto',
      bottom: 'auto',
      margin: 0,
      transform: `translate(${fallbackVar(pointShiftX, '0px')}, ${fallbackVar(pointShiftY, '0px')})`,
    },

    // Growth away from the point on the side axis, gap included.
    '&:where([data-point][data-side="top"])': {
      vars: { [pointShiftY]: `calc(-100% - ${gap})` },
    },
    '&:where([data-point][data-side="bottom"])': {
      vars: { [pointShiftY]: gap },
    },
    '&:where([data-point][data-side="left"])': {
      vars: { [pointShiftX]: `calc(-100% - ${gap})` },
    },
    '&:where([data-point][data-side="right"])': {
      vars: { [pointShiftX]: gap },
    },

    // Alignment relative to the point on the edge axis, nudge included.
    '&:where([data-point][data-side="top"][data-align="start"], [data-point][data-side="bottom"][data-align="start"])':
      {
        vars: { [pointShiftX]: nudge },
      },
    '&:where([data-point][data-side="top"][data-align="center"], [data-point][data-side="bottom"][data-align="center"])':
      {
        vars: { [pointShiftX]: `calc(-50% + ${nudge})` },
      },
    '&:where([data-point][data-side="top"][data-align="end"], [data-point][data-side="bottom"][data-align="end"])':
      {
        vars: { [pointShiftX]: `calc(-100% - ${nudge})` },
      },

    '&:where([data-point][data-side="left"][data-align="start"], [data-point][data-side="right"][data-align="start"])':
      {
        vars: { [pointShiftY]: nudge },
      },
    '&:where([data-point][data-side="left"][data-align="center"], [data-point][data-side="right"][data-align="center"])':
      {
        vars: { [pointShiftY]: `calc(-50% + ${nudge})` },
      },
    '&:where([data-point][data-side="left"][data-align="end"], [data-point][data-side="right"][data-align="end"])':
      {
        vars: { [pointShiftY]: `calc(-100% - ${nudge})` },
      },
  },
});

/**
 * The visual surface. Sizes to its content so a window hugs what it
 * holds instead of wrapping or stretching to fill the positioning shell.
 */
export const body = style({
  width: 'max-content',
  height: 'max-content',
});

/** Per-step border radius for the surface, keyed by the design scale. */
export const bodyRadius = styleVariants(radius, (value) => ({
  borderRadius: value,
}));

/**
 * Maps the surface radius to the arrow's corner offset. The straight run
 * of a rounded edge begins exactly one radius in from the corner, so a
 * start/end-aligned arrow clears the curve when nudged by that same
 * distance — the offset is the radius value verbatim.
 */
export const arrowRadiusOffset = styleVariants(radius, (value) => ({
  vars: { [offset]: value },
}));
