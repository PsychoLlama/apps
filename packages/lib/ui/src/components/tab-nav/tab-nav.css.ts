/**
 * TabNav-specific styles. The list/trigger scaffolding lives in
 * `../tabs/shared.css.ts` and is shared with Tabs.
 */

import { style } from '@vanilla-extract/css';

/** `<li>` wrapper around each link. */
export const item = style({
  display: 'flex',
});
