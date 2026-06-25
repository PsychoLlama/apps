import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';

/** Caps the showcase width so the copy keeps a comfortable reading measure. */
export const layout = style({
  maxWidth: `calc(${space[9]} * 8)`,
});
