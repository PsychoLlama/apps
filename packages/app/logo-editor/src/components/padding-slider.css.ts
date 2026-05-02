import { style } from '@vanilla-extract/css';
import { neutral } from '@lib/design';

export const value = style({
  minWidth: '4ch',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  color: neutral.solid[11],
});
