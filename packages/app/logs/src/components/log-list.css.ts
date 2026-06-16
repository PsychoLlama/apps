import { style } from '@vanilla-extract/css';
import { fast, space, standard, text } from '@lib/design';

export const list = style({
  listStyle: 'none',
});

/** `display: contents` so the `<li>` adds no box between the list and the card. */
export const item = style({
  display: 'contents',
});

export const card = style({
  width: '100%',
});

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
