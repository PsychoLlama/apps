import { style } from '@vanilla-extract/css';
import { neutral, space, text } from '#design';

export const header = style({
  borderBottom: `1px solid ${neutral[6]}`,
  flexShrink: 0,
});

export const logoLink = style({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: text.lowContrast,
  flexShrink: 0,
});

export const divider = style({
  width: '1px',
  height: space[5],
  backgroundColor: neutral[6],
  flexShrink: 0,
});
