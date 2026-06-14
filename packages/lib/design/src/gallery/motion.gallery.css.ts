import { createVar, keyframes, style } from '@vanilla-extract/css';
import {
  accent,
  background,
  neutral,
  radius,
  shadow,
  space,
} from '@lib/design';

/** Animation duration, supplied per cell via `assignInlineVars`. */
export const durationVar = createVar();

/** Easing curve for the slide thumb, supplied per cell via `assignInlineVars`. */
export const easingVar = createVar();

// --- Durations ---

/** Loop a swatch between a neutral surface and the accent fill. */
const pulse = keyframes({
  from: { backgroundColor: neutral.solid[3] },
  to: { backgroundColor: accent.solid[9] },
});

/**
 * Square that pulses its background at the cell's duration (via `--duration`).
 * The timing is linear so only the speed reads, not an easing curve. Under
 * `prefers-reduced-motion` the duration tokens collapse to `0s` and it rests on
 * the neutral base.
 */
export const swatch = style({
  width: space[9],
  height: space[9],
  borderRadius: radius[2],
  boxShadow: shadow[2],
  backgroundColor: neutral.solid[3],
  animationName: pulse,
  animationDuration: durationVar,
  animationTimingFunction: 'linear',
  animationDirection: 'alternate',
  animationIterationCount: 'infinite',
});

// --- Easings ---

/** Slide a thumb the width of the rail; container units keep it inside. */
const slide = keyframes({
  from: { transform: 'translateX(0)' },
  to: { transform: `translateX(calc(100cqi - ${space[4]}))` },
});

/** Fixed-width rail. Establishes the container the thumb measures against. */
export const track = style({
  width: `calc(${space[9]} * 3)`,
  height: space[5],
  padding: space[1],
  borderRadius: radius.full,
  backgroundColor: background.panelSolid,
  boxShadow: shadow[1],
  containerType: 'inline-size',
});

/**
 * Thumb that slides end to end on the cell's easing curve (via `--easing`), at
 * a fixed, deliberately slow duration (via `--duration`) so the curve — not the
 * speed — is what reads.
 */
export const thumb = style({
  width: space[4],
  height: '100%',
  borderRadius: radius.full,
  backgroundColor: accent.solid[9],
  boxShadow: shadow[3],
  animationName: slide,
  animationDuration: durationVar,
  animationTimingFunction: easingVar,
  animationDirection: 'alternate',
  animationIterationCount: 'infinite',
  animationFillMode: 'both',
});
