import { style } from '@vanilla-extract/css';
import { fontWeight, neutral, space, text, typeScale } from '#design-system';

export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[4],
  padding: `${space[2]} ${space[4]}`,
  borderBottom: `1px solid ${neutral[6]}`,
  flexShrink: 0,
});

export const logoLink = style({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: text.highContrast,
  flexShrink: 0,
});

export const divider = style({
  width: '1px',
  height: space[5],
  backgroundColor: neutral[6],
  flexShrink: 0,
});

export const title = style({
  fontSize: typeScale[2].fontSize,
  lineHeight: typeScale[2].lineHeight,
  letterSpacing: typeScale[2].letterSpacing,
  fontWeight: fontWeight.medium,
  color: text.lowContrast,
});
