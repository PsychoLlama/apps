import { style } from '@vanilla-extract/css';
import { accent, fast, neutral, radius, space, standard } from '@lib/design';

export const column = style({
  maxWidth: '480px',
  width: '100%',
});

export const icon = style({
  width: space[8],
  height: space[8],
  borderRadius: radius.full,
  backgroundColor: accent.alpha[3],
  color: accent.solid[11],
});

export const details = style({
  width: '100%',
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
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  paddingBlock: space[3],
  paddingInline: space[3],
  borderRadius: radius[3],
  backgroundColor: neutral.alpha[2],
  boxShadow: `inset 0 0 0 1px ${neutral.solid[5]}`,
});
