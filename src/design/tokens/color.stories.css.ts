import { style } from '@vanilla-extract/css';
import { neutral, space, radius } from '#design';

export const scaleGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: space[1],
});

export const swatch = style({
  height: space[8],
  borderRadius: radius[3],
});

export const checkerboard = style({
  backgroundImage: [
    `linear-gradient(45deg, ${neutral[3]} 25%, transparent 25%)`,
    `linear-gradient(-45deg, ${neutral[3]} 25%, transparent 25%)`,
    `linear-gradient(45deg, transparent 75%, ${neutral[3]} 75%)`,
    `linear-gradient(-45deg, transparent 75%, ${neutral[3]} 75%)`,
  ].join(', '),
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
});

export const swatchOverlay = style({
  width: '100%',
  height: '100%',
  borderRadius: radius[3],
});

export const textSwatch = style({
  width: space[8],
  height: space[8],
  borderRadius: radius[3],
});

export const bgRow = style({
  display: 'grid',
  gridTemplateColumns: `${space[9]} 1fr`,
  gap: space[4],
  alignItems: 'center',
});

export const bgSwatch = style({
  aspectRatio: '2 / 1',
  borderRadius: radius[3],
  border: `1px solid ${neutral[6]}`,
});
