import { style } from '@vanilla-extract/css';

/**
 * What was shared. Keeps the line breaks it was written with, and breaks
 * anywhere when it must: a long address or token has no spaces to wrap at.
 */
export const body = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});
