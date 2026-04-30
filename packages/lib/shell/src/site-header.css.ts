import { style } from '@vanilla-extract/css';
import { neutral, text } from '@lib/design';

export const header = style({
  borderBottom: `1px solid ${neutral.solid[6]}`,
  flexShrink: 0,
});

export const separator = style({
  color: text.lowContrast,
  flexShrink: 0,
});
