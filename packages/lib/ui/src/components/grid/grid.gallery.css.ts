import { style } from '@vanilla-extract/css';
import { fontFamily, neutral, radius, space, typeScale } from '@lib/design';
import { hatch } from '../../gallery/hatch.css';

/**
 * Bounded surface wide enough to show several columns side by side. A step
 * lighter than the hatch base so the tiles read against it.
 */
export const container = style({
  width: `calc(${space[9]} * 3)`,
  padding: space[2],
  backgroundColor: neutral.alpha[2],
  borderRadius: radius[3],
});

/**
 * A cell tile. Width is left to the grid so it stretches to fill its column;
 * a fixed height keeps rows uniform. The shared hatch marks it as a
 * placeholder; the numeral stays so the row-major fill order reads.
 */
export const tile = style([
  hatch,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: space[6],
    color: neutral.solid[12],
    fontFamily: fontFamily.body,
    fontSize: typeScale[1].fontSize,
  },
]);
