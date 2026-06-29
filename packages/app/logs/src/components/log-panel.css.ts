import { style } from '@vanilla-extract/css';
import { text } from '@lib/design';

/**
 * The meta fields (time, origin) read as a single token each — let them size to
 * content and never wrap, so the row spends its wrapping budget on the message.
 */
export const metaCell = style({
  whiteSpace: 'nowrap',
});

/**
 * The message takes the rest of the row and carries any wrapping. A min measure
 * keeps it readable: when the meta and a legible message can't share one line,
 * the row wraps the message to its own full-width line rather than shredding it
 * to a one-word sliver. Wide viewports never hit the floor, so desktop layout
 * is unchanged.
 */
export const message = style({
  flexGrow: 1,
  minWidth: '32ch',
});

/**
 * The chevron dividing origin segments — a quiet tick between names, matching
 * the breadcrumb separator in the site header. Low-contrast so the names lead;
 * never shrinks, so the glyph stays whole when the breadcrumb wraps.
 */
export const originSeparator = style({
  color: text.lowContrast,
  flexShrink: 0,
});
