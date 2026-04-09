import { style } from '@vanilla-extract/css';
import { text, neutral, typeScale, fontWeight, space, radius } from '#design';

export const heading = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.highContrast,
  marginBottom: space[2],
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[4],
});

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

export const swatchLabel = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  textAlign: 'center',
  marginTop: space[1],
  color: text.lowContrast,
});

export const textSwatch = style({
  width: space[8],
  height: space[8],
  borderRadius: radius[3],
});

export const textSample = style({
  fontSize: typeScale[5].fontSize,
  lineHeight: typeScale[5].lineHeight,
  letterSpacing: typeScale[5].letterSpacing,
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

export const bgLabel = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  color: text.highContrast,
});
