import { style } from '@vanilla-extract/css';

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
