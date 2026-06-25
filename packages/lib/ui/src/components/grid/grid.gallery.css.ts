import { style } from '@vanilla-extract/css';
import {
  accent,
  fontFamily,
  neutral,
  radius,
  space,
  typeScale,
} from '@lib/design';

/** Bounded surface wide enough to show several columns side by side. */
export const container = style({
  width: `calc(${space[9]} * 3)`,
  padding: space[2],
  backgroundColor: neutral.alpha[3],
  borderRadius: radius[3],
});

/**
 * A cell tile. Width is left to the grid so it stretches to fill its column;
 * a fixed height keeps rows uniform.
 */
export const tile = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: space[6],
  backgroundColor: accent.solid[9],
  color: accent.contrast,
  borderRadius: radius[1],
  fontFamily: fontFamily.body,
  fontSize: typeScale[1].fontSize,
});
