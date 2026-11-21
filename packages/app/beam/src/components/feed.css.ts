import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

/**
 * The feed sits on the composer and grows upward from it: a short one
 * leaves its empty space above, where a chat's would be.
 */
export const feed = style({
  marginTop: 'auto',
});

const rule = {
  content: '""',
  flex: '1 1 0',
  borderTop: `1px solid ${neutral.solid[6]}`,
};

/** A day's label, with a rule either side taking what room is left. */
export const day = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[3],
  whiteSpace: 'nowrap',
  '::before': rule,
  '::after': rule,
});
