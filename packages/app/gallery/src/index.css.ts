import { style } from '@vanilla-extract/css';
import { fast, space, standard, text } from '@lib/design';

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

/** The landing page's manifest card list. */
export const cardList = style({
  listStyle: 'none',
});

/** A card list item collapses so the card itself is the flex child. */
export const cardItem = style({
  display: 'contents',
});

/** A manifest card stretches to fill the capped column width. */
export const card = style({
  width: '100%',
});

/** The trailing chevron nudges toward its target on card hover/focus. */
export const chevron = style({
  color: text.lowContrast,
  flexShrink: 0,
  transition: `translate ${fast[2]} ${standard.productive}`,
  selectors: {
    [`${card}:hover &, ${card}:focus-visible &`]: {
      translate: `${space[1]} 0`,
    },
  },
});
