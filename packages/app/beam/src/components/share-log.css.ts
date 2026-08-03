import { style } from '@vanilla-extract/css';
import { neutral, radius, space, typeScale } from '@lib/design';

/**
 * The zone itself — one surface holding everything that has passed between
 * the two devices, rather than a stack of one card per item.
 *
 * The distinction is the whole point of the shape. A card per share draws a
 * frame around each one and reads as a sequence of messages, which is what
 * this isn't: nothing here is addressed to anyone or replied to. One bordered
 * region with items ruled off inside it reads as what it is — a surface two
 * devices are putting things down on, ordered by when they landed.
 *
 * Rounded a step past the container default. The zone is the largest surface
 * on the page and it sits directly under the composer, so at the standard
 * step its corners read as sharp against the field above them — the softer
 * one makes it a place things are set down rather than a panel.
 *
 * `overflow: hidden` so the rules and any row's hover fill stop at the
 * rounded corners instead of squaring them off.
 */
export const zone = style({
  border: `1px solid ${neutral.alpha[6]}`,
  borderRadius: radius[5],
  overflow: 'hidden',
});

/**
 * One item on the surface. The rule belongs to the row above its neighbour
 * rather than around every row, so the zone has one outer edge and the items
 * inside it are separated rather than boxed.
 */
export const row = style({
  padding: space[3],
  selectors: {
    '& + &': {
      borderTop: `1px solid ${neutral.alpha[6]}`,
    },
  },
});

/**
 * Which way an item went, as a glyph in the row's gutter.
 *
 * The direction used to be a name — "You" or the peer's — which is the label
 * a chat transcript needs and this doesn't. There are only ever two devices
 * here and the page is already titled with the other one, so the only fact
 * left is which way the thing moved, and an arrow says that in the width of
 * an icon rather than a column of repeated names.
 *
 * Sized by the type rather than in pixels. The icon draws itself at `1em`, so
 * setting the step the body beside it is set at leaves the arrow in scale with
 * the text it labels — and it stays that way if the body's step ever moves.
 *
 * Nudged down to sit on the first line of that body: the row aligns to the
 * top, and a square glyph box is shorter than a line of text, so without the
 * offset it rides high against the text's cap height.
 */
export const direction = style({
  flexShrink: 0,
  fontSize: typeScale[2].fontSize,
  marginBlockStart: space[1],
  color: neutral.alpha[11],
});

/**
 * A row's contents. `minWidth: 0` opts out of the flex item's automatic
 * minimum, which would otherwise floor the row at the width of the longest
 * unbroken run in the body and push the actions off the end.
 */
export const content = style({
  minWidth: 0,
});

/**
 * A shared body. Text arrives with the shape it had where it was copied
 * from, so the newlines are kept rather than collapsed — a pasted address or
 * a snippet of code is unreadable as one run-on line.
 *
 * `anywhere` because a share is frequently a URL: one unbroken hundred-
 * character token with nowhere to wrap would otherwise widen the row past
 * the screen it's being read on.
 *
 * Clamped, because the zone is meant to be scanned. Enough lines to read a
 * password or an address in full, and past that the item is identifiable
 * from its opening — which is all it needs to be, since taking it is a copy
 * away rather than a read.
 */
export const body = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 4,
  overflow: 'hidden',
});
