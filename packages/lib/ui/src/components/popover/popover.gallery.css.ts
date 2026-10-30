import { style } from '@vanilla-extract/css';
import { hatch } from '#gallery/style';

/**
 * The room each popover has to open into. A fixed, hatched box so the
 * boundary the tether collides with is visible.
 */
export const stage = style([
  hatch,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24rem',
    height: '16rem',
  },
]);
