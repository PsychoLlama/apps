import { style } from '@vanilla-extract/css';

/**
 * The peer's name as the page's title. A local name has no length limit and
 * nothing obliges it to contain a space, so the heading breaks mid-word rather
 * than letting one long name widen the page and squeeze the controls beside
 * it.
 */
export const name = style({
  overflowWrap: 'anywhere',
});

/**
 * Rename and Forget, as a pair beside the name. They opt out of the flex
 * default of shrinking to fit: their labels are the whole control, so a
 * narrow screen has to wrap the heading — which it can, mid-word — rather
 * than squeeze two words onto three lines each.
 */
export const actions = style({
  flexShrink: 0,
});
