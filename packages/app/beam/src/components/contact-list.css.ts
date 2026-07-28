import { style } from '@vanilla-extract/css';

/**
 * A contact row. Positioned so the name's link can stretch its hit area over
 * the whole card — a row on a phone is a thumb target, not a word.
 */
export const row = style({
  position: 'relative',
});

/**
 * The contact's name, and the row's link. The pseudo-element covers the card
 * so a press anywhere on the row navigates, while the accessible name stays
 * the text itself rather than a card's worth of markup. It's invisible, so it
 * carries no radius of its own; the focus ring belongs to the anchor.
 */
export const stretchedLink = style({
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
    },
  },
});
