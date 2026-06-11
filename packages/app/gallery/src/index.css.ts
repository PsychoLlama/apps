import { style } from '@vanilla-extract/css';
import { neutral } from '@lib/design';

/**
 * Fills the space below the site header and establishes the scroll context for
 * its children — `min-height: 0` lets the row shrink past its content so the
 * sidebar can own its overflow instead of growing the page.
 */
export const body = style({
  flex: '1 1 auto',
  minHeight: 0,
});

/**
 * The persistent left rail. A fixed-width, full-height column that never
 * shrinks, divided from the content area by the same hairline the site header
 * uses. Scrolls within its own bounds rather than the page.
 */
export const sidebar = style({
  flexShrink: 0,
  width: '15rem',
  borderInlineEnd: `1px solid ${neutral.solid[6]}`,
  overflowY: 'auto',
  minHeight: 0,
});
