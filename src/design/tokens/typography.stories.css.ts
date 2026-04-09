import { style } from '@vanilla-extract/css';
import { text, typeScale, space } from '#design';

export const label = style({
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].lineHeight,
  letterSpacing: typeScale[1].letterSpacing,
  color: text.lowContrast,
  marginBottom: space[1],
});

export const sampleText = style({
  color: text.highContrast,
});

export const typeSample = style({
  fontSize: typeScale[6].fontSize,
  lineHeight: typeScale[6].lineHeight,
  letterSpacing: typeScale[6].letterSpacing,
  color: text.highContrast,
});
