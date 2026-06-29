import { style } from '@vanilla-extract/css';

/**
 * The meta columns (time, level, origin) read as a single token each — let
 * them size to content and never wrap, so only the message column reflows.
 */
export const metaCell = style({
  whiteSpace: 'nowrap',
});
