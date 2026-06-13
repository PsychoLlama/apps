import { style } from '@vanilla-extract/css';

/**
 * The active view. Fills the space below the site header and owns its own
 * vertical scroll — `min-height: 0` lets it shrink past its content so the
 * overflow stays here rather than growing the page.
 */
export const content = style({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
});
