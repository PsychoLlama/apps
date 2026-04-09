import { style } from '@vanilla-extract/css';
import { text, neutral, typeScale, space } from '#design';

export const radiusGrid = style({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, ${space[9]})`,
  gap: space[5],
  alignItems: 'end',
});

export const radiusItem = style({
  textAlign: 'center',
});

export const radiusBox = style({
  aspectRatio: '1',
  backgroundColor: neutral[9],
});

export const radiusLabel = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  marginTop: space[2],
  color: text.lowContrast,
});
