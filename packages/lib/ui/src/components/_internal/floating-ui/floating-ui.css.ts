import {
  createVar,
  fallbackVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import { radius } from '@lib/design';
import { offset } from './arrow.css';

/**
 * The root wrapper — the box a floating window positions against.
 *
 * Deliberately featureless, and that's the whole point. An absolutely
 * positioned child resolves its percentages against the nearest
 * positioned ancestor's *padding* box, while `getBoundingClientRect()`
 * — what the tether measures — returns the *border* box. Put the
 * positioning context on an element that carries a border and the two
 * disagree by that border's width, so the window shifts the moment the
 * tether takes over. A wrapper with no border of its own collapses the
 * two boxes onto each other and the disagreement can't arise.
 *
 * Consumers style the element they wrap, never this one.
 */
const rootBase = style({
  position: 'relative',
});

/**
 * How the root wrapper sits in the surrounding flow. Both modes
 * shrink-wrap: a stretched wrapper would put its own edges where the
 * anchored element's should be, and `left: 100%` would bind the window
 * to the wrong box — the same class of error the border-box collapse
 * above exists to prevent, only wider.
 *
 * Shrink-wrapping is also why the wrapper takes a `class`: it can size
 * itself to its content but can't infer that an anchor was meant to
 * stretch. That case sizes the wrapper, which now *is* the anchor's box.
 */
export const root = styleVariants({
  block: [rootBase, { display: 'block', width: 'fit-content' }],
  inline: [rootBase, { display: 'inline-block' }],
});

/**
 * Gap between the anchor edge and the window, in px. Assigned inline
 * by the window from its `sideOffset` prop; unset falls back to `0`.
 */
export const sideOffset = createVar();

/**
 * Nudge along the bound edge, in px. Assigned inline by the window
 * from its `alignOffset` prop. Positive values push a `start`-aligned
 * window toward `end`, an `end`-aligned window toward `start`, and a
 * centered window toward `end` — the same logical inversion Radix
 * applies, so flipping alignment never flips the offset's sign.
 */
export const alignOffset = createVar();

/**
 * Point-mode coordinates, in px from the anchor's top-left corner.
 * Assigned inline by the window from its `point` prop.
 */
export const pointX = createVar();
export const pointY = createVar();

/**
 * Override slot for the window's `transform-origin`. Unset, the
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
 * Room the window has inside its clipping boundary, published by the
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
// applied. Assigned by `data-side`, which is what decides whether a
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
 * Edge mode (default): `data-side` places the window fully outside the
 * chosen edge of the anchor and `data-align` positions it along that
 * edge — `start` hugs the top/left, `end` the bottom/right.
 * {@link sideOffset} opens a gap off the edge; {@link alignOffset}
 * nudges along it.
 *
 * Point mode (`data-point`): the window binds to a coordinate inside the
 * anchor box instead of an edge, so only the pins change — the
 * translation already describes which way the window grows and how far
 * the offsets displace it.
 *
 * Tethered (`data-tethered`): once `@floating-ui/dom` has measured the
 * page, its answer supersedes both — the pins collapse to the anchor's
 * corner and the window rides on the tether's own translation instead.
 * The rules above remain the pre-JS (and no-JS) placement, and
 * `data-side`/`data-align` keep reflecting the resolved placement so
 * everything keyed off them — the arrow's edge, the transform origin,
 * consumer animations — still follows the window.
 *
 * Placement rides on `translate` rather than `transform`, which leaves
 * `transform` entirely to consumers: a scale-in animation composes with
 * the placement instead of overwriting it.
 *
 * A flexbox lays out the arrow and body. Each side sets its own
 * `flex-direction`, which seats the DOM-first arrow onto the edge facing
 * the anchor (reversed for top/left).
 *
 * Every selector is wrapped in `:where(...)` so all rules hold equal
 * specificity and the cascade resolves by source order — the point-mode
 * and tethered pins sit last so they can override the edge-mode ones.
 */
export const window = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  transformOrigin: fallbackVar(
    transformOrigin,
    `${fallbackVar(originX, '50%')} ${fallbackVar(originY, '50%')}`,
  ),
  translate: `${shift(originX, signX, distanceX)} ${shift(originY, signY, distanceY)}`,
  selectors: {
    // Which offset runs along which axis. The side offset always travels
    // on the axis facing the anchor, the align offset on the axis
    // running along the edge — `data-side` is what says which is which.
    '&:where([data-side="top"], [data-side="bottom"])': {
      vars: { [distanceX]: nudge, [distanceY]: gap },
    },
    '&:where([data-side="left"], [data-side="right"])': {
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

    // Align along a horizontal edge (top/bottom): start=left … end=right.
    '&:where([data-align="start"]):where([data-side="top"], [data-side="bottom"])':
      {
        left: 0,
        vars: { [originX]: '0%' },
      },

    '&:where([data-align="center"]):where([data-side="top"], [data-side="bottom"])':
      {
        left: '50%',
      },

    '&:where([data-align="end"]):where([data-side="top"], [data-side="bottom"])':
      {
        left: '100%',
        vars: { [originX]: '100%', [signX]: '-1' },
      },

    // Align along a vertical edge (left/right): start=top … end=bottom.
    '&:where([data-align="start"]):where([data-side="left"], [data-side="right"])':
      {
        top: 0,
        vars: { [originY]: '0%' },
      },

    '&:where([data-align="center"]):where([data-side="left"], [data-side="right"])':
      {
        top: '50%',
      },

    '&:where([data-align="end"]):where([data-side="left"], [data-side="right"])':
      {
        top: '100%',
        vars: { [originY]: '100%', [signY]: '-1' },
      },

    // --- Point mode ---
    // Repin both axes to the point. Declared after the edge rules so it
    // wins on source order; the translation needs no adjustment.
    '&:where([data-point])': {
      top: fallbackVar(pointY, '0px'),
      left: fallbackVar(pointX, '0px'),
    },

    // --- Tethered ---
    // The tether resolves position in the anchor's own coordinate space,
    // so pinning the window to the anchor's top-left corner and
    // translating by its answer lands it exactly.
    '&:where([data-tethered])': {
      top: 0,
      left: 0,
      translate: `${fallbackVar(tetherX, '0px')} ${fallbackVar(tetherY, '0px')}`,
    },
  },
});

/**
 * The visual surface. Sizes to its content so a window hugs what it
 * holds instead of wrapping or stretching to fill the positioned box.
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
