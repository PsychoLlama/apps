import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

export const scaleRow = style({
  gridTemplateColumns: 'max-content 1fr',
});

export const scaleGrid = style({
  gridTemplateColumns: 'repeat(12, 1fr)',
});

export const swatch = style({
  height: space[8],
});

export const checkerboard = style({
  backgroundImage: [
    `linear-gradient(45deg, ${neutral.solid[3]} 25%, transparent 25%)`,
    `linear-gradient(-45deg, ${neutral.solid[3]} 25%, transparent 25%)`,
    `linear-gradient(45deg, transparent 75%, ${neutral.solid[3]} 75%)`,
    `linear-gradient(-45deg, transparent 75%, ${neutral.solid[3]} 75%)`,
  ].join(', '),
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
});

export const swatchOverlay = style({
  width: '100%',
  height: '100%',
});

export const textSwatch = style({
  width: space[8],
  height: space[8],
});

export const bgSwatch = style({
  width: space[8],
  height: space[8],
  border: `1px solid ${neutral.solid[6]}`,
});
