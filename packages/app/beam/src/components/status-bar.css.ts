import { style } from '@vanilla-extract/css';
import { background, neutral, space } from '@lib/design';

/**
 * The bar itself, pinned under the frame's scrolling body rather than inside
 * it: it reports on the session, which outlives any one `/beam/*` route, and
 * a status that moved with the content would be somewhere different on every
 * page. The top border and opaque surface separate it from the content
 * scrolling past behind it, the same way the pairing tray above it does.
 *
 * Padded evenly, and tightly — nothing here is a tap target, so the bar costs
 * the page as little as a line of text allows on every side.
 */
export const bar = style({
  padding: space[2],
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
});
