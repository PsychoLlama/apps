import { style } from '@vanilla-extract/css';
import { text } from '@lib/design';

export const list = style({
  listStyle: 'none',
});

export const item = style({
  display: 'contents',
});

export const card = style({
  width: '100%',
});

export const icon = style({
  color: text.lowContrast,
  flexShrink: 0,
});
