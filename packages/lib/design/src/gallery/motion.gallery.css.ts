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

/**
 * Square that eases its background between a neutral surface and the accent fill.
 * A shared clock toggles every swatch's {@link swatchLit} class in lockstep; each
 * then transitions at the cell's own duration (via `--duration`), so the fast
 * steps snap and the slow ones glide, yet all flip together and hold until the
 * next tick. The timing is linear so only the speed reads, not an easing curve.
 * `--duration` is fed each token's concrete literal rather than the live CSS var,
 * so the swatch keeps demonstrating its speed even under `prefers-reduced-motion`.
 */
export const swatch = style({
  width: space[9],
  height: space[9],
  borderRadius: radius[2],
  boxShadow: shadow[2],
  backgroundColor: neutral.solid[3],
  transitionProperty: 'background-color',
  transitionDuration: durationVar,
  transitionTimingFunction: 'linear',
});

/** Lit state of a duration swatch, toggled in unison by the shared clock. */
export const swatchLit = style({
  backgroundColor: accent.solid[9],
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
