import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

/**
 * The feed sits on the composer and grows upward from it: a short one
 * leaves its empty space above, where a chat's would be.
 */
export const feed = style({
  marginTop: 'auto',
});

/**
 * A row that begins something: a sitting, or what hasn't synced. Set
 * off from the row above it, unless it's the first of its day, which
 * the day's own label already sets off.
 */
export const apart = style({
  selectors: {
    '&:not(:first-child)': {
      marginTop: space[3],
    },
  },
});

/**
 * A feed with nothing in it has nothing to sit on the composer, so what
 * it says instead takes the middle of the room.
 */
export const blank = style({
  margin: 'auto',
});

const rule = {
  content: '""',
  flex: '1 1 0',
  borderTop: `1px solid ${neutral.solid[6]}`,
};

/**
 * A label across the feed, with a rule either side taking what room is
 * left: a day, or where what hasn't synced begins.
 */
export const day = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[3],
  whiteSpace: 'nowrap',
  '::before': rule,
  '::after': rule,
});
