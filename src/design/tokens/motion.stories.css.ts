import { keyframes, style } from '@vanilla-extract/css';
import { accent, space } from '#design';

// --- Duration swatch ---

export const swatch = style({
  width: space[9],
  height: space[9],
  transitionProperty: 'background-color',
  transitionTimingFunction: 'linear',
});

// --- Easing track ---

export const easingGrid = style({
  gridTemplateColumns: 'auto 1fr',
});

export const track = style({
  height: space[5],
  padding: space[1],
  containerType: 'inline-size',
});

export const slide = keyframes({
  from: { transform: 'translateX(0)' },
  to: { transform: `translateX(calc(100cqi - ${space[4]}))` },
});

export const bar = style({
  width: space[4],
  height: '100%',
  backgroundColor: accent[9],
  animationName: slide,
  animationFillMode: 'forwards',
});
