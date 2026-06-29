import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

/**
 * The time reads as a single token — let it size to content and never wrap, so
 * the lead line keeps a tidy clock beside the level and origin.
 */
export const metaCell = style({
  whiteSpace: 'nowrap',
});

/**
 * The message leads the second line; its attribute badges trail it. A short
 * message shares the line with them, while a long one wraps to fill the width
 * and pushes the badges below. `minWidth: 0` lets it shrink past its longest
 * word and `overflowWrap` breaks any unbreakable token, so text reflows instead
 * of overflowing.
 */
export const message = style({
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
