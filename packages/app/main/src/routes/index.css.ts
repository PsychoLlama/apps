import { style } from '@vanilla-extract/css';
import { accent, fast, space, standard, text } from '@lib/design';

export const list = style({
  width: '100%',
  maxWidth: '640px',
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
  transition: `color ${fast[2]} ${standard.productive}`,
  selectors: {
    [`${card}:hover &, ${card}:focus-visible &`]: {
      color: accent.solid[11],
    },
  },
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

export const footer = style({
  color: text.lowContrast,
});
