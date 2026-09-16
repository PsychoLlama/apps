import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';

/** A group section. Groups breathe at section rhythm; the last sits flush. */
export const group = style({
  marginBottom: space[9],
  selectors: {
    '&:last-child': { marginBottom: 0 },
  },
});
