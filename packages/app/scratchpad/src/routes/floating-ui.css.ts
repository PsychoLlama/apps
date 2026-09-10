import { style } from '@vanilla-extract/css';
import {
  background,
  breakpoint,
  neutral,
  radius,
  shadow,
  space,
  text,
} from '@lib/design';

/**
 * Caps the page's single column so long control labels stay readable,
 * then lets it out once {@link configs} has the room to run two abreast.
 */
export const column = style({
  width: '100%',
  maxWidth: '32rem',
  alignSelf: 'center',
  '@media': {
    [breakpoint.md]: {
      maxWidth: '64rem',
    },
  },
});

/**
 * The two config groups. A grid rather than a `Flex` with a responsive
 * `direction`: the axis flips inside a media query, and a bare class
 * can't reliably outrank the component's own `direction` variant.
 *
 * `align-items: start` keeps the shorter group from stretching to match
 * the taller one, which would strand its controls in dead space.
 */
export const configs = style({
  display: 'grid',
  alignItems: 'start',
  gap: space[7],
  '@media': {
    [breakpoint.md]: {
      gridTemplateColumns: '1fr 1fr',
      gap: space[8],
    },
  },
});

/**
 * The scrollport the target sits in — a small square window onto a much
 * larger {@link canvas}. Deliberately shrunk: a scrolling clip boundary
 * is the interesting case for the tether, and one that fits on screen
 * lets you drag the anchor to an edge and watch the window re-place.
 *
 * Sized from `min()` on the inline axis with the block axis derived from
 * `aspect-ratio`, so it stays square under every cap. A `maxHeight`
 * alongside the ratio would squash it into a rectangle instead; folding
 * the viewport cap into the same `min()` keeps one axis authoritative.
 *
 * `overscrollBehavior` keeps a flick at the edge from chaining out to
 * the frame body — on a phone that would scroll the page away mid-drag.
 * The opaque `background` is the same trick `FrameBody` uses: a
 * transparent nested scroller can't take the compositor's fast path.
 */
export const stage = style({
  alignSelf: 'center',
  width: 'min(100%, 60dvh)',
  aspectRatio: '1',
  overflow: 'auto',
  overscrollBehavior: 'contain',
  border: `1px dashed ${neutral.alpha[6]}`,
  borderRadius: radius[3],
  backgroundColor: background.page,
});

/**
 * The oversized surface inside {@link stage}, three times the port on
 * both axes so the target can be scrolled clean off any edge. The route
 * parks the initial scroll in the middle, which leaves a full port's
 * worth of travel in every direction.
 */
export const canvas = style({
  // `flex-shrink` is load-bearing, not a guard: the canvas is a flex item
  // of the port, so the default `1` lets the inline axis collapse straight
  // back to 100% and the port only ever scrolls vertically.
  flexShrink: 0,
  width: '300%',
  height: '300%',
});

/**
 * The `FloatingRoot` wrapper's slot in the canvas.
 *
 * `flex-shrink` is the only thing the wrapper needs from the page: it's
 * the flex item now, and the default `1` would let the canvas squeeze it
 * narrower than the target it wraps. Everything else about its box comes
 * from shrink-wrapping the target.
 */
export const anchorSlot = style({
  flexShrink: 0,
});

/**
 * The shrunk box the floating window anchors against. Kept small and
 * centered in its canvas so the window stays visible whichever side it
 * binds to. Diagonal hatching makes the box's bounds obvious.
 *
 * The dashed border is what makes this the interesting case: the
 * `FloatingRoot` wrapper exists so the tether and the CSS placement
 * agree on where this box's edges are despite it.
 */
export const target = style({
  width: '12rem',
  height: '8rem',
  borderRadius: radius[4],
  border: `1px dashed ${neutral.solid[7]}`,
  backgroundColor: neutral.solid[2],
  backgroundImage: `repeating-linear-gradient(-45deg, ${neutral.alpha[4]} 0, ${neutral.alpha[4]} 1px, transparent 1px, transparent 10px)`,
});

/**
 * Signals that a click on the target will re-place the bound point.
 * Applied alongside {@link target} while point mode is armed.
 */
export const pointArmed = style({
  cursor: 'crosshair',
});

/** Keeps a number field to roughly the digits it will ever hold. */
export const numberControl = style({
  maxWidth: '10rem',
});

/**
 * Runs the reset button across the full width of {@link configs}. It
 * clears both groups, so it belongs to neither column — parking it under
 * one would read as resetting only that half.
 */
export const reset = style({
  gridColumn: '1 / -1',
});

/** Sets a control's explanatory note back from its label. */
export const hint = style({
  color: text.lowContrast,
});

/**
 * The floating window's visual surface, applied straight onto the
 * `FloatingBody` via the container's `class`. A high-contrast inverted
 * panel (dark on light themes, light on dark) so it always reads as a
 * distinct window. `color` cascades into the `<Heading>`/`<Text>` (which
 * inherit `currentColor`).
 *
 * Only holds what the container has no prop for: the fill, text color,
 * elevation, and a width cap. Layout (column flow, gap) and padding ride
 * in as the container's flex/padding props; radius as its `radius` prop.
 */
export const surface = style({
  maxWidth: '16rem',
  backgroundColor: neutral.solid[12],
  color: neutral.solid[1],
  boxShadow: shadow[4],
});

/**
 * Arrow tint. Matches the {@link surface} fill so the pointer reads as an
 * extension of the panel — the SVG fills with `currentColor`.
 */
export const arrow = style({
  color: neutral.solid[12],
});
