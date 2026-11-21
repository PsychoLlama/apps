import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { neutral, radius, slow, space, standard, success } from '@lib/design';

const base = style({
  flexShrink: 0,
  width: space[2],
  height: space[2],
  borderRadius: radius.full,
});

const pulse = keyframes({
  '50%': { opacity: 0.3 },
});

/**
 * The dot after the status, by state. Green only for online; the other
 * two are gray, since neither is anything to worry about, and a device
 * still connecting is told from one that's offline by its dot fading in
 * and out.
 */
export const dot = styleVariants({
  online: [base, { backgroundColor: success.solid[9] }],
  offline: [base, { backgroundColor: neutral.solid[8] }],
  connecting: [
    base,
    {
      backgroundColor: neutral.solid[8],
      animation: `${pulse} calc(2 * ${slow[2]}) ${standard.productive} infinite`,
    },
  ],
});
