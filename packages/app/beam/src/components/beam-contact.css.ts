import { style } from '@vanilla-extract/css';

/**
 * The endpoint key: 64 hex characters with no spaces to break on. Wrapping
 * anywhere keeps it inside the column instead of stretching the page sideways
 * on a phone.
 */
export const endpointId = style({
  overflowWrap: 'anywhere',
});
