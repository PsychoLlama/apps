import { globalStyle, style } from '@vanilla-extract/css';
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

/**
 * One item's place in a sitting. The item's menu wraps it in an area
 * that hugs its content, and takes no class to say otherwise: stretched
 * from here, so a short note's row is as wide, and as easy to point at,
 * as a long one's.
 */
export const row = style({});

// The area is the menu's own element, so it's reached as the row's child.
// Named by tag as well as class to outrank the width it's given.
globalStyle(`${row} > div`, {
  width: 'auto',
});

/** A day's label, with a rule either side taking what room is left. */
export const day = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[3],
  whiteSpace: 'nowrap',
  '::before': rule,
  '::after': rule,
});
