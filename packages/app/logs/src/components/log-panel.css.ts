import { style } from '@vanilla-extract/css';
import { neutral, space, typeScale } from '@lib/design';
import { inset } from '@lib/shell/frame.css';

/**
 * The day list, broken out of the frame's inset so rows run edge to edge.
 * The bottom keeps its inset: whatever follows the list sits beneath it.
 */
export const panel = style({
  marginBlockStart: `calc(-1 * ${inset})`,
  marginInline: `calc(-1 * ${inset})`,
});

/**
 * A day's heading, pinned while its logs scroll past beneath it. Sticky
 * offsets count from inside the scrollport's padding, so it pulls back up
 * by the inset to pin flush with the top. Entries aren't positioned, so it
 * paints over them as is.
 */
export const dayHeading = style({
  position: 'sticky',
  top: `calc(-1 * ${inset})`,
  paddingBlock: space[1],
  paddingInline: space[3],
  backgroundColor: neutral.solid[2],
  borderBottom: `1px solid ${neutral.solid[6]}`,
});

/** One entry in the day's list, ruled off from the next. */
export const entry = style({
  borderBottom: `1px solid ${neutral.solid[4]}`,
});

/** An entry's always-visible content: lead line, origin, errors. */
export const summary = style({
  paddingBlock: space[2],
  paddingInline: space[3],
});

/** A summary with attributes behind it. Clicking it toggles the table. */
export const expandable = style({
  cursor: 'pointer',
  ':hover': {
    backgroundColor: neutral.alpha[2],
  },
});

/**
 * Holds the chevron in a column of its own, so the lead line, origin, and
 * errors all start past it. One message line tall, which is the lead
 * line's first row, so the chevron centers on it however the rest wraps.
 */
export const disclosureSlot = style({
  flexShrink: 0,
  height: typeScale[2].bodyLineHeight,
});

/** Points right when closed, down when open. */
export const disclosure = style({
  width: space[4],
  height: space[4],
  color: neutral.alpha[11],
  selectors: {
    '[open] > summary &': {
      transform: 'rotate(90deg)',
    },
  },
});

/**
 * Holds the chevron's place on entries with nothing to disclose, so every
 * entry's content lines up.
 */
export const disclosurePlaceholder = style({
  width: space[4],
  height: space[4],
  visibility: 'hidden',
});

/** Everything past the chevron. Takes the rest of the row. */
export const content = style({
  flexGrow: 1,
  minWidth: 0,
});

/**
 * The attribute table, lined up with the content above it: the summary's
 * gutter, the chevron, and the gap past it, less the `space[2]` of padding
 * the cells already carry.
 */
export const attributes = style({
  paddingInlineStart: `calc(${space[3]} + ${space[4]} + ${space[3]} - ${space[2]})`,
  paddingInlineEnd: space[1],
  paddingBottom: space[2],
});

/** Keys stay on one line; values take the remaining width. */
export const attributeKey = style({
  whiteSpace: 'nowrap',
  width: '1%',
});

/** String values keep their line breaks and wrap anywhere. */
export const stringValue = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});

/** JSON literals wrap anywhere, so a long array can't widen the table. */
export const literal = style({
  overflowWrap: 'anywhere',
});

/**
 * Time, level, message, and origin. Wide gaps between items on a line, but
 * a tight one between lines, so a wrapped origin still reads as part of
 * the entry above it.
 */
export const leadLine = style({
  columnGap: space[3],
  rowGap: space[1],
});

/**
 * The time reads as a single token — let it size to content and never wrap, so
 * the lead line keeps a tidy clock beside the level and message.
 */
export const metaCell = style({
  whiteSpace: 'nowrap',
});

/**
 * The message grows into whatever the lead line has spare, which pins the
 * origin to the trailing end. Flex lines break at the last item that
 * doesn't fit, so the origin wraps below first; only a message too long
 * for the line drops below the time and level. `minWidth: 0` lets it
 * shrink past its longest word and `overflowWrap` breaks any unbreakable
 * token, so text reflows instead of overflowing.
 */
export const message = style({
  flexGrow: 1,
  minWidth: 0,
  overflowWrap: 'anywhere',
});

/**
 * The chevron dividing origin segments — a quiet tick between names. Paints the
 * exact color the origin `Code` segments use (`neutral` ghost is `alpha[11]`),
 * so the glyph reads as part of the same breadcrumb rather than a hair off it.
 * Never shrinks, so it stays whole when the breadcrumb wraps.
 */
export const originSeparator = style({
  color: neutral.alpha[11],
  flexShrink: 0,
});

/**
 * The error callout sits a step further from the entry than its other
 * lines. Adds to the summary's row gap so the callout reads as a distinct
 * block rather than another inline detail.
 */
export const errorCallout = style({
  marginTop: space[1],
});

/**
 * The error chain, rendered as preformatted text: whitespace is preserved so a
 * multi-line message keeps its shape, and long lines wrap rather than overflow
 * the callout. The monospace face comes from the `Code` it wraps.
 */
export const errorOutput = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});
