import { style } from '@vanilla-extract/css';
import { space } from '#design';

/** Layout and utility styles shared across multiple token stories. */

export const stack = {
  sm: style({ display: 'flex', flexDirection: 'column', gap: space[3] }),
  md: style({ display: 'flex', flexDirection: 'column', gap: space[5] }),
  lg: style({ display: 'flex', flexDirection: 'column', gap: space[6] }),
};

export const muted = style({
  opacity: 0.6,
});
