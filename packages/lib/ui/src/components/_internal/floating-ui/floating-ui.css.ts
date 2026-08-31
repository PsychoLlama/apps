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
 * origin at the anchor's exact position after collision handling.
 */
export const transformOrigin = createVar();

/**
 * The tether's resolved position, in px from the anchor's padding box.
 * Only meaningful under {@link tethered}, where they replace the CSS
 * placement outright rather than adjusting it.
 */
export const tetherX = createVar();
export const tetherY = createVar();

/**
 * Room the surface has inside its clipping boundary, published by the
 * tether's size pass. Surfaces that should scroll rather than overflow
 * read these — `max-height: var(--available-height)` on the body — and
 * they're simply unset without JavaScript.
 */
export const availableWidth = createVar();
export const availableHeight = createVar();

/**
 * The anchor's measured box, published by the tether. Size-matched
 * surfaces (a select's listbox) read these to track the trigger's
 * width.
 */
export const anchorWidth = createVar();
export const anchorHeight = createVar();

// Composition channels for the side/align-derived transform origin.
// Side rules assign the axis facing the anchor; align rules assign the
// axis running along the edge; unset halves resolve to center.
const originX = createVar();
const originY = createVar();

// Which way the surface grows along each axis: `1` toward the positive
// end (right/down), `-1` back toward the negative end. Assigned by
// whichever rule binds that axis — the side rule for the anchor-facing
// axis, the align rule for the axis running along the edge.
const signX = createVar();
const signY = createVar();

// The surface's displacement from whatever it's bound to, per axis.
// Center-aligned edge rules read their one axis; point mode reads both.
const shiftX = createVar();
const shiftY = createVar();

const gap = fallbackVar(sideOffset, '0px');
const nudge = fallbackVar(alignOffset, '0px');

/**
 * Displacement along one axis: pull the surface back by the corner
 * facing whatever it's bound to, then push it away by `distance`.
 *
 * That corner is the one `transform-origin` already names, so the origin
 * var doubles as the fraction — negated, because the origin points *at*
 * the binding while the shift moves *away* from it. The sign turns the
 * offset around for the sides and alignments that grow backwards. One
 * expression therefore covers all ten placements, which is what lets
 * point mode reuse the side and align rules instead of restating them.
 */
const shift = (origin: string, sign: string, distance: string) =>
  `calc(-1 * ${fallbackVar(origin, '50%')} + ${distance} * ${sign})`;

/**
 * Positioning container for the floating surface.
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
 * Margins can't displace a top/left-bound box, so both axes ride on the
 * {@link shift} translation the side and align rules already publish.
 *
 * Tethered (`data-tethered`): once `@floating-ui/dom` has measured the
 * page, its answer supersedes both — every inset, margin, and transform
 * the placement rules set is cleared and the surface rides on a single
 * translation. The rules above remain the pre-JS (and no-JS) placement,
 * and `data-side`/`data-align` keep reflecting the resolved placement so
 * everything keyed off them — the arrow's edge, the transform origin,
 * consumer animations — still follows the surface.
 *
 * A flexbox lays out the arrow and body. Each side sets its own
 * `flex-direction`, which seats the DOM-first arrow onto the edge facing
 * the anchor (reversed for top/left).
 *
 * Every selector is wrapped in `:where(...)` so all rules hold equal
 * specificity and the cascade resolves by source order — the point-mode
 * and tethered blocks sit last so they can override the edge-mode rules.
 */
export const container = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
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
      vars: {
        [originY]: '100%',
        [signY]: '-1',
        [shiftY]: shift(originY, signY, gap),
      },
    },
    '&:where([data-side="bottom"])': {
      top: '100%',
      marginTop: gap,
      flexDirection: 'column',
      vars: {
        [originY]: '0%',
        [signY]: '1',
        [shiftY]: shift(originY, signY, gap),
      },
    },
    '&:where([data-side="left"])': {
      right: '100%',
      marginRight: gap,
      flexDirection: 'row-reverse',
      vars: {
        [originX]: '100%',
        [signX]: '-1',
        [shiftX]: shift(originX, signX, gap),
      },
    },
    '&:where([data-side="right"])': {
      left: '100%',
      marginLeft: gap,
      flexDirection: 'row',
      vars: {
        [originX]: '0%',
        [signX]: '1',
        [shiftX]: shift(originX, signX, gap),
      },
    },

    // Align along a horizontal edge (top/bottom): start=left … end=right.
    '&:where([data-side="top"][data-align="start"], [data-side="bottom"][data-align="start"])':
      {
        left: 0,
        marginLeft: nudge,
        vars: {
          [originX]: '0%',
          [signX]: '1',
          [shiftX]: shift(originX, signX, nudge),
        },
      },

    '&:where([data-side="top"][data-align="center"], [data-side="bottom"][data-align="center"])':
      {
        left: '50%',
        transform: `translateX(${fallbackVar(shiftX, '0px')})`,
        vars: {
          [signX]: '1',
          [shiftX]: shift(originX, signX, nudge),
        },
      },

    '&:where([data-side="top"][data-align="end"], [data-side="bottom"][data-align="end"])':
      {
        right: 0,
        marginRight: nudge,
        vars: {
          [originX]: '100%',
          [signX]: '-1',
          [shiftX]: shift(originX, signX, nudge),
        },
      },

    // Align along a vertical edge (left/right): start=top … end=bottom.
    '&:where([data-side="left"][data-align="start"], [data-side="right"][data-align="start"])':
      {
        top: 0,
        marginTop: nudge,
        vars: {
          [originY]: '0%',
          [signY]: '1',
          [shiftY]: shift(originY, signY, nudge),
        },
      },

    '&:where([data-side="left"][data-align="center"], [data-side="right"][data-align="center"])':
      {
        top: '50%',
        transform: `translateY(${fallbackVar(shiftY, '0px')})`,
        vars: {
          [signY]: '1',
          [shiftY]: shift(originY, signY, nudge),
        },
      },

    '&:where([data-side="left"][data-align="end"], [data-side="right"][data-align="end"])':
      {
        bottom: 0,
        marginBottom: nudge,
        vars: {
          [originY]: '100%',
          [signY]: '-1',
          [shiftY]: shift(originY, signY, nudge),
        },
      },

    // --- Point mode ---
    // Bind the surface's reference corner to the point, then translate
    // by the shift both axes already carry. Declared after the edge
    // rules so it wins on source order.
    '&:where([data-point])': {
      top: fallbackVar(pointY, '0px'),
      left: fallbackVar(pointX, '0px'),
      right: 'auto',
      bottom: 'auto',
      margin: 0,
      transform: `translate(${fallbackVar(shiftX, '0px')}, ${fallbackVar(shiftY, '0px')})`,
    },

    // --- Tethered ---
    // The tether resolves position in the anchor's own coordinate
    // space, so pinning the container to the anchor's top-left corner and
    // translating by its answer lands the surface exactly. Everything
    // the placement rules above set has to be cleared first, or their
    // insets and margins would compound with the translation.
    '&:where([data-tethered])': {
      inset: 'auto',
      top: 0,
      left: 0,
      margin: 0,
      transform: 'none',
      translate: `${fallbackVar(tetherX, '0px')} ${fallbackVar(tetherY, '0px')}`,
    },
  },
});

/**
 * The visual surface. Sizes to its content so a window hugs what it
 * holds instead of wrapping or stretching to fill the positioning container.
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
