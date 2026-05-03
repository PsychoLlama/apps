/**
 * RadioGroup item styles. The root layout is delegated to `<Flex>`;
 * these rules govern only the inline label each item renders when
 * `children` are provided.
 *
 * @see https://www.radix-ui.com/themes/docs/components/radio-group
 */

import { style } from '@vanilla-extract/css';

export const item = style({
  display: 'flex',
  alignItems: 'center',
  // `0.5em` matches Radix and scales the gap with the label's font
  // size — at smaller sizes the radio sits closer to the text, at
  // larger sizes the gap grows. A fixed token would drift visually
  // across our 1/2/3 size range.
  // eslint-disable-next-line custom/require-design-tokens -- text-relative gap is the design intent here
  gap: '0.5em',
  // Trim the click target to the label's own width so whitespace to
  // the right of the text is not clickable.
  width: 'fit-content',

  selectors: {
    // Disabled cursor must reach the entire label, not just the
    // input. Without this, hovering the label text shows the default
    // cursor across most of the click target.
    '&:where(:has(input:disabled))': {
      cursor: 'not-allowed',
    },
  },
});

export const itemInner = style({
  // Allow text truncation inside the label content.
  minWidth: 0,
});
