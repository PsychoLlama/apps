import { style } from '@vanilla-extract/css';
import { accent } from '@lib/design';

/**
 * A contact row. Positioned so the name's link can stretch its hit area over
 * the whole card — a row on a phone is a thumb target, not a word.
 */
export const row = style({
  position: 'relative',
});

/**
 * The row whose peer is the one on screen. Only ever visible in the sidebar,
 * where the list survives the navigation it caused — a page that replaces the
 * list it was tapped in has nothing left to mark.
 *
 * A tinted fill plus an accent border, rather than one or the other: the fill
 * alone is a weak signal against a card that already has a surface, and the
 * border alone reads as hover. `&&` doubles the class specificity so this
 * wins against `Card`'s own rules regardless of stylesheet order, and the
 * border rides `Card`'s `::after` — the pseudo-element it draws its own
 * outline on — so the two can't both paint.
 */
export const currentRow = style({
  selectors: {
    '&&': {
      backgroundColor: accent.alpha[3],
    },
    '&&::after': {
      boxShadow: `inset 0 0 0 1px ${accent.alpha[8]}`,
    },
  },
});

/**
 * The contact's name, and the row's link. The pseudo-element covers the card
 * so a press anywhere on the row navigates, while the accessible name stays
 * the text itself rather than a card's worth of markup. It's invisible, so it
 * carries no radius of its own; the focus ring belongs to the anchor.
 *
 * Truncation needs the block display — an inline box has no width to overflow
 * — and `minWidth: 0` to opt out of the flex item's automatic minimum, which
 * would otherwise floor the link at the width of its own text and push the
 * badge off the row instead.
 */
export const stretchedLink = style({
  display: 'block',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
    },
  },
});
