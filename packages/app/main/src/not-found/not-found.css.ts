import { style } from '@vanilla-extract/css';
import { accent, accentAlpha, radius, space } from '@lib/design';

export const page = style({
  minHeight: '100dvh',
});

export const iconHalo = style({
  width: space[9],
  height: space[9],
  borderRadius: radius.full,
  backgroundColor: accentAlpha[3],
  color: accent[11],
  fontSize: space[7],
});

export const column = style({
  maxWidth: '420px',
  width: '100%',
});
