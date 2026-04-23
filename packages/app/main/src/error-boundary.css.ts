import { style } from '@vanilla-extract/css';
import {
  accent,
  accentAlpha,
  fast,
  neutral,
  neutralAlpha,
  radius,
  space,
  standard,
} from '@lib/design';

export const page = style({
  minHeight: '100dvh',
});

export const column = style({
  maxWidth: '480px',
  width: '100%',
});

export const icon = style({
  width: space[8],
  height: space[8],
  borderRadius: radius.full,
  backgroundColor: accentAlpha[3],
  color: accent[11],
});

export const details = style({
  width: '100%',
  borderRadius: radius[4],
});

export const summary = style({
  cursor: 'pointer',
  alignSelf: 'center',
  paddingBlock: space[2],
  paddingInline: space[3],
  borderRadius: radius[3],
  transitionProperty: 'background-color, color',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
  ':hover': {
    backgroundColor: neutralAlpha[3],
  },
  ':focus-visible': {
    outline: `2px solid ${accent[8]}`,
    outlineOffset: '2px',
  },
});

export const summaryChevron = style({
  color: neutral[11],
  transitionProperty: 'transform',
  transitionDuration: fast[2],
  transitionTimingFunction: standard.productive,
  selectors: {
    'details[open] &': {
      transform: 'rotate(90deg)',
    },
  },
});

export const detailsBody = style({
  marginTop: space[3],
  borderRadius: radius[4],
  boxShadow: `inset 0 0 0 1px ${neutral[6]}`,
});

export const stack = style({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  paddingBlock: space[3],
  paddingInline: space[3],
  borderRadius: radius[3],
  backgroundColor: neutralAlpha[2],
  boxShadow: `inset 0 0 0 1px ${neutral[5]}`,
});
