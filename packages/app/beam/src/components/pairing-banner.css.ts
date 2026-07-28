import { style } from '@vanilla-extract/css';
import { background, neutral, space } from '@lib/design';

/**
 * The tray pairing requests sit in, pinned below the scrolling body rather
 * than inside it. A request arrives while the reader is doing something
 * else, and the frame is shared by every `/beam/*` route — dropping it into
 * whichever page happens to be open would push that page's content around
 * and put the question somewhere different each time.
 *
 * Bottom rather than top: it's the only chrome here that wants a tap, and
 * the bottom of a phone is where a thumb already is. The top border and
 * opaque surface separate it from the content scrolling past behind it.
 */
export const tray = style({
  padding: space[5],
  borderTop: `1px solid ${neutral.alpha[6]}`,
  backgroundColor: background.page,
});
