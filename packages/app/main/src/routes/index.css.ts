import { style } from '@vanilla-extract/css';
import { fast, space, standard, text } from '@lib/design';

export const list = style({
  listStyle: 'none',
});

export const item = style({
  display: 'contents',
});

export const card = style({
  width: '100%',
});

export const icon = style({
  color: text.lowContrast,
  flexShrink: 0,
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

/**
 * The footer is pushed to the bottom of the frame by the growing content
 * above it, but on a short viewport (or a long app list) there's nothing
 * left to push with and the source link collides with the last card. The
 * margin is the floor: a minimum gap the squeeze can never close.
 */
export const footer = style({
  marginBlockStart: space[6],
});
