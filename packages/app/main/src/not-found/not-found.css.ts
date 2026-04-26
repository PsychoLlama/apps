import { style } from '@vanilla-extract/css';
import { accent, radius, space } from '@lib/design';

export const iconHalo = style({
  width: space[9],
  height: space[9],
  borderRadius: radius.full,
  backgroundColor: accent.alpha[3],
  color: accent.solid[11],
  fontSize: space[7],
});

export const column = style({
  maxWidth: '420px',
  width: '100%',
});
