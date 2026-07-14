import { style } from '@vanilla-extract/css';
import { neutral, radius, shadow } from '@lib/design';

/**
 * The play area the target sits in, centered in the space the controls
 * leave. Framed with a dashed border and given generous height so the
 * floating window has room to float off any side.
 */
export const stage = style({
  minHeight: '65dvh',
  border: `1px dashed ${neutral.alpha[6]}`,
  borderRadius: radius[3],
});

/**
 * The shrunk box the floating window anchors against. Kept small and
 * centered in its stage so the window stays visible whichever side it
 * binds to. Diagonal hatching makes the box's bounds obvious.
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

/** Fixed width so the offset sliders have a track to render. */
export const offsetControl = style({
  width: '12rem',
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
