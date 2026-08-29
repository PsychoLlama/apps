import { fallbackVar, style } from '@vanilla-extract/css';
import { background, neutral, radius, shadow, text } from '@lib/design';
import {
  availableHeight,
  availableWidth,
} from '@lib/ui/_internal/floating-ui.css';

/** Caps the page's single column so long control labels stay readable. */
export const column = style({
  width: '100%',
  maxWidth: '32rem',
  alignSelf: 'center',
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
  width: '300%',
  height: '300%',
});

/**
 * The shrunk box the floating window anchors against. Kept small and
 * centered in its canvas so the window stays visible whichever side it
 * binds to. Diagonal hatching makes the box's bounds obvious.
 */
export const target = style({
  flexShrink: 0,
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

/** Caps a slider so its track never outruns a comfortable reading width. */
export const sliderControl = style({
  maxWidth: '20rem',
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

/**
 * Opts the surface into the room the tether measured. The vars are only
 * set once the tether has run, so untethered (and pre-hydration) the
 * caps fall back to `none` and the surface sizes to its content.
 *
 * This is the "size matching" half of the primitive: the same channel a
 * scrolling menu would use to cap its height at whatever the viewport
 * left it.
 */
export const clamped = style({
  maxWidth: fallbackVar(availableWidth, 'none'),
  maxHeight: fallbackVar(availableHeight, 'none'),
  overflow: 'auto',
});
