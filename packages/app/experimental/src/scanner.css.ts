import { style } from '@vanilla-extract/css';
import { neutral, radius, shadow } from '@lib/design';

export const viewport = style({
  position: 'relative',
  width: '100%',
  maxWidth: '40rem',
  aspectRatio: '4 / 3',
  background: neutral.solid[2],
  borderRadius: radius[4],
  boxShadow: shadow[2],
  overflow: 'hidden',
});

export const video = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});
