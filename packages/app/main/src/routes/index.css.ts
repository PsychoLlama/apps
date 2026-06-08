import { style } from '@vanilla-extract/css';
import { accent, radius, space } from '@lib/design';

export const grid = style({
  width: '100%',
  maxWidth: '720px',
  listStyle: 'none',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
});

export const item = style({
  display: 'contents',
});

export const card = style({
  height: '100%',
});

export const iconTile = style({
  width: space[8],
  height: space[8],
  borderRadius: radius[3],
  flexShrink: 0,
  background: accent.solid[3],
  color: accent.solid[11],
});
