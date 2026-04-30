/**
 * Tabs-specific styles. The list/trigger scaffolding lives in `shared.css.ts`
 * and is also consumed by TabNav.
 */

import { style } from '@vanilla-extract/css';
import { accent } from '@lib/design';

export const content = style({
  outline: 'none',
  selectors: {
    // Re-assert the UA `[hidden] { display: none }` rule at our own
    // specificity so a consumer's `display: …` class on TabsContent
    // can't keep an inactive panel in layout. The compound selector
    // outranks a plain class while still respecting `!important`.
    '&[hidden]': {
      display: 'none',
    },
    '&:focus-visible': {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '2px',
    },
  },
});
