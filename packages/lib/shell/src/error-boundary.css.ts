import { style } from '@vanilla-extract/css';
import { fast, neutral, radius, space, standard } from '@lib/design';

export const details = style({
  width: '100%',
  userSelect: 'text',
});

export const summaryChevron = style({
  transitionProperty: 'transform',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
  selectors: {
    'details[open] &': {
      transform: 'rotate(90deg)',
    },
  },
});

export const stack = style({
  width: '100%',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  paddingBlock: space[3],
  paddingInline: space[3],
  borderRadius: radius[3],
  backgroundColor: neutral.alpha[2],
  boxShadow: `inset 0 0 0 1px ${neutral.solid[5]}`,
});
