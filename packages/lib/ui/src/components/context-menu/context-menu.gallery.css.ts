import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';
import { hatch } from '#gallery/style';

/**
 * The area each menu opens from, and the room it opens into. A fixed,
 * hatched box so both the target and the boundary the tether collides
 * with are visible.
 */
export const area = style([
  hatch,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24rem',
    height: '28rem',
    padding: space[3],
    color: neutral.alpha[11],
  },
]);
