import { style } from '@vanilla-extract/css';
import { hatch } from '#gallery/style';

/**
 * The room each tooltip has to open into. A fixed, hatched box so the
 * boundary the tether collides with is visible, and so the window has
 * space on every side rather than relying on the section grid — which
 * scrolls on the x-axis and therefore clips on the y-axis too.
 */
export const stage = style([
  hatch,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20rem',
    height: '10rem',
  },
]);
