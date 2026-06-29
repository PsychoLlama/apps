import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

/**
 * The meta fields (time, origin) read as a single token each — let them size to
 * content and never wrap, so the row spends its wrapping budget on the message.
 */
export const metaCell = style({
  whiteSpace: 'nowrap',
});

/**
 * The message takes the rest of the lead line and carries any wrapping.
 * `flexBasis: 0` keeps its hypothetical size from triggering a flex-wrap, so a
 * long message grows into the remaining width and wraps *in place* — staying
 * beside the time and level rather than breaking onto a full-width row of its
 * own. `minWidth: 0` lets it shrink past its longest word so the text reflows
 * instead of overflowing.
 */
export const message = style({
  flexGrow: 1,
  flexBasis: 0,
  minWidth: 0,
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
 * The error callout sits a step further from the entry than its other lines —
 * the meta strip's badges crowd it otherwise. Adds to the entry's row gap so
 * the callout reads as a distinct block rather than another inline detail.
 */
export const errorCallout = style({
  marginTop: space[2],
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
