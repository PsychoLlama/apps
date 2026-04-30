/**
 * Layout fixture for the `display`-class regression test in
 * `tabs.test.browser.tsx`. Mimics a real consumer using a flex column
 * rail with a flex-grow tab panel inside.
 */

import { style } from '@vanilla-extract/css';

export const rail = style({
  display: 'flex',
  flexDirection: 'column',
  height: '400px',
});

export const flexPanel = style({
  display: 'flex',
  flex: '1 1 auto',
  minHeight: 0,
});
