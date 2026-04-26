/**
 * Tabs-specific styles. The list/trigger scaffolding lives in `shared.css.ts`
 * and is also consumed by TabNav.
 */

import { style } from '@vanilla-extract/css';
import { accent, neutral, space } from '@lib/design';
import { activeIndicator } from './shared.css';

/** Stacks list-on-top, content-below by default. */
export const root = style({
  display: 'block',
});

/** Applied to root when `orientation="vertical"`: list on the left, content on the right. */
export const rootVertical = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: space[3],
});

/** Applied to the list when `orientation="vertical"`. */
export const listVertical = style({
  flexDirection: 'column',
  alignItems: 'stretch',
  overflowX: 'visible',
  overflowY: 'auto',
  boxShadow: `inset -1px 0 0 0 ${neutral.alpha[5]}`,
});

export const content = style({
  outline: 'none',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '2px',
    },
  },
});

/**
 * Applied to active triggers inside a vertical list. Repaints the
 * `::before` indicator on the right edge so it aligns with the list's
 * vertical separator instead of running across the bottom.
 */
export const triggerActiveVertical = style({
  selectors: {
    '&::before': {
      top: 0,
      bottom: 0,
      left: 'auto',
      right: 0,
      width: '2px',
      height: 'auto',
      backgroundColor: activeIndicator,
    },
  },
});
