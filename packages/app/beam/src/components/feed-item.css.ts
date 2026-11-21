import { style } from '@vanilla-extract/css';
import {
  background,
  fast,
  neutral,
  radius,
  shadow,
  space,
  standard,
} from '@lib/design';

/**
 * What was shared. Keeps the line breaks it was written with, and breaks
 * anywhere when it must: a long address or token has no spaces to wrap at.
 */
export const body = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});

/**
 * The area an item's menu opens over. It would hug the item, and is
 * stretched instead, so a short note's row is as wide, and as easy to
 * point at, as a long one's. Doubled to outrank the width it's given.
 */
export const area = style({
  selectors: {
    '&&': {
      width: 'auto',
    },
  },
});

/**
 * One item's row. Tinted while it's pointed at or holds focus, so it's
 * plain which item the actions beside it belong to. The tint runs past
 * the text on both sides, and the row is pulled out by as much, so what
 * was shared stays in line with everything else in the feed.
 */
export const item = style({
  position: 'relative',
  marginInline: `calc(-1 * ${space[3]})`,
  padding: `${space[1]} ${space[3]}`,
  borderRadius: radius[3],
  transition: `background-color ${fast[1]} ${standard.productive}`,
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:hover, &:focus-within': {
          backgroundColor: neutral.alpha[2],
        },
      },
    },
  },
});

/** What was shared takes the row, and the actions take what they need. */
export const content = style({
  flex: '1 1 0',
  minWidth: 0,
});

/**
 * What can be done with an item.
 *
 * Where there's a pointer, a small bar riding the row's top corner, out
 * of sight until the row is pointed at or holds focus. It floats, so it
 * takes no room from what was shared and nothing wraps to make way.
 *
 * On a touch screen there's nothing to point with, so the same buttons
 * sit at the end of the row and are always there.
 */
export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[1],
  flexShrink: 0,
  '@media': {
    '(hover: hover)': {
      position: 'absolute',
      top: `calc(-1 * ${space[4]})`,
      right: space[3],
      padding: space[1],
      border: `1px solid ${neutral.solid[6]}`,
      borderRadius: radius[3],
      backgroundColor: background.panelSolid,
      boxShadow: shadow[2],
      opacity: 0,
      pointerEvents: 'none',
      selectors: {
        [`${item}:hover > &, ${item}:focus-within > &`]: {
          opacity: 1,
          pointerEvents: 'auto',
        },
      },
    },
  },
});
