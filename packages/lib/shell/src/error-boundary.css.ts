import { style } from '@vanilla-extract/css';
import { fast, neutral, radius, space, standard } from '@lib/design';

export const details = style({
  width: '100%',
  userSelect: 'text',
});

// The details element is a full-width column, so its summary button
// would stretch edge to edge. Shrink it to its label and center it,
// leaving the revealed card below at full width.
export const summary = style({
  alignSelf: 'center',
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
