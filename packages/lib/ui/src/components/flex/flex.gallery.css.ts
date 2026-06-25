import { style } from '@vanilla-extract/css';
import { fontFamily, neutral, radius, space, typeScale } from '@lib/design';
import { hatch } from '../../gallery/hatch.css';

/**
 * Bounded surface, larger than the tiles it holds, so direction, alignment,
 * and distribution have room to read. A step lighter than the hatch base so
 * the tiles read against it.
 */
export const container = style({
  width: `calc(${space[9]} * 2)`,
  height: `calc(${space[9]} * 2)`,
  padding: space[2],
  backgroundColor: neutral.alpha[2],
  borderRadius: radius[3],
});

/**
 * A fixed-width tile with no fixed height — its height collapses to the
 * numeral, so `align="stretch"` visibly expands it while `start`/`center`/`end`
 * leave it at content height. The shared hatch marks it as a placeholder; the
 * numeral stays so reversed and redistributed orders read.
 */
export const tile = style([
  hatch,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: space[6],
    padding: space[1],
    color: neutral.solid[12],
    fontFamily: fontFamily.body,
    fontSize: typeScale[1].fontSize,
  },
]);
