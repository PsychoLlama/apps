/**
 * Tabs-specific styles. The list/trigger scaffolding lives in `shared.css.ts`
 * and is also consumed by TabNav.
 */

import { style } from '@vanilla-extract/css';
import { accent } from '@lib/design';

export const content = style({
  outline: 'none',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '2px',
    },
  },
});
