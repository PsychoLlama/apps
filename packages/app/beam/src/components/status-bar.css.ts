import { style } from '@vanilla-extract/css';
import { background, neutral, space } from '@lib/design';

/**
 * The bar itself, pinned under the frame's scrolling body rather than inside
 * it: it reports on the session, which outlives any one `/beam/*` route, and
 * a status that moved with the content would be somewhere different on every
 * page. The top border and opaque surface separate it from the content
 * scrolling past behind it, the same way the pairing tray above it does.
 *
 * Tighter vertical padding than the tray — nothing here is a tap target, so
 * the bar costs the page as little height as a line of text allows.
 */
export const bar = style({
  paddingBlock: space[2],
  paddingInline: space[5],
  borderTop: `1px solid ${neutral.alpha[6]}`,
  backgroundColor: background.page,
});

/**
 * The relay reading's live region. `inline-flex` puts the label and its value
 * on one line with a real gap between them, rather than leaning on a text
 * node's collapsible whitespace; baseline alignment keeps them sitting on the
 * same line even if the two ever differ in size.
 */
export const status = style({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: space[1],
  // The peer reading carries a name of unbounded length, so it's the side
  // that gives way — first by capping itself, then by shrinking below that
  // when the bar runs out of room. `min-width: 0` opts out of the flex item's
  // automatic minimum, which would otherwise floor it at the width of the
  // name and push the relay reading off the other edge.
  minWidth: 0,
});

/**
 * The focused peer's name. Truncates rather than wrapping: the bar is one
 * line of chrome, and a name is the one thing in it with no length limit.
 *
 * The trailing colon goes with it — a name long enough to clip is one whose
 * punctuation the ellipsis stands in for anyway. Block display is what gives
 * the box a width to overflow in the first place; an inline one has none.
 */
export const peerName = style({
  display: 'block',
  minWidth: 0,
  maxWidth: '12rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
