import { style } from '@vanilla-extract/css';
import { text, background, typeScale, space, radius } from '#design';

export const shadowGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: space[6],
});

export const shadowItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: space[2],
});

export const shadowCard = style({
  padding: `${space[5]} ${space[6]}`,
  backgroundColor: background.panelSolid,
  borderRadius: radius[4],
});

export const shadowLabel = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  color: text.lowContrast,
});

export const shadowCaption = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  color: text.lowContrast,
  marginTop: space[2],
});
