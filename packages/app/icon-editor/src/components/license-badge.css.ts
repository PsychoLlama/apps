import { style } from '@vanilla-extract/css';

// Pin the chip to the top of the icon-summary row so it reads as a
// corner tag beside the taller thumbnail rather than centering against
// it. `flexShrink: 0` keeps a long SPDX id from being compressed.
export const root = style({
  alignSelf: 'flex-start',
  flexShrink: 0,
});
