import { style } from '@vanilla-extract/css';
import {
  accent,
  fontFamily,
  neutral,
  radius,
  space,
  typeScale,
} from '@lib/design';

/**
 * Bounded surface, larger than the tiles it holds, so direction, alignment,
 * and distribution have room to read.
 */
export const container = style({
  width: `calc(${space[9]} * 2)`,
  height: `calc(${space[9]} * 2)`,
  padding: space[2],
  backgroundColor: neutral.alpha[3],
  borderRadius: radius[3],
});

/**
 * A fixed-width tile with no fixed height — its height collapses to the
 * numeral, so `align="stretch"` visibly expands it while `start`/`center`/`end`
 * leave it at content height.
 */
export const tile = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: space[6],
  padding: space[1],
  backgroundColor: accent.solid[9],
  color: accent.contrast,
  borderRadius: radius[1],
  fontFamily: fontFamily.body,
  fontSize: typeScale[1].fontSize,
});
