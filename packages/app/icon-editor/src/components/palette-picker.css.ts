import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '@lib/design';

const SWATCH_MIN_WIDTH = '28px';

export const grid = style({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(${SWATCH_MIN_WIDTH}, 1fr))`,
  gap: space[1],
});

export const swatch = style({
  aspectRatio: '1 / 1',
  minWidth: SWATCH_MIN_WIDTH,
  borderRadius: radius[2],
  border: `1px solid ${neutral.alpha[6]}`,
  cursor: 'pointer',
  transitionProperty: 'transform, box-shadow, border-color',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
  ':hover': {
    transform: 'scale(1.06)',
  },
  ':focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${accent.alpha[6]}`,
  },
});

export const swatchActive = style({
  boxShadow: `0 0 0 2px ${accent.solid[8]}`,
  borderColor: accent.solid[8],
});
