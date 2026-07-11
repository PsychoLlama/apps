import { style } from '@vanilla-extract/css';
import { neutral, radius, shadow, space } from '@lib/design';

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
 * The floating window's visual surface. A high-contrast inverted panel
 * (dark on light themes, light on dark) so it always reads as a distinct
 * window, with a heading/body pairing sized tall enough that arrows bound
 * to the left/right edges have room to sit mid-height. `color` cascades
 * into the `<Heading>`/`<Text>` (which inherit `currentColor`).
 */
export const surface = style({
  maxWidth: '16rem',
  padding: `${space[3]} ${space[4]}`,
  // Inherit the radius the FloatingBody sets, so the fill matches the
  // corner the container rounds and offsets the arrow against.
  borderRadius: 'inherit',
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
