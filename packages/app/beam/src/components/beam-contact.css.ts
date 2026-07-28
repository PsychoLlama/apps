import { style } from '@vanilla-extract/css';

/**
 * The contact's name as the page's title. A local name has no length limit
 * and nothing obliges it to contain a space, so the heading breaks mid-word
 * rather than letting one long name widen the page.
 */
export const name = style({
  overflowWrap: 'anywhere',
});

/**
 * The endpoint key: 64 hex characters with no spaces to break on. Wrapping
 * anywhere keeps it inside the column instead of stretching the page sideways
 * on a phone.
 */
export const endpointId = style({
  overflowWrap: 'anywhere',
});
