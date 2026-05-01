import { style } from '@vanilla-extract/css';
import {
  accent,
  background,
  breakpoint,
  danger,
  fontWeight,
  neutral,
  radius,
  shadow,
  space,
  success,
  typeScale,
} from '@lib/design';

export const stage = style({
  flex: '1 1 auto',
  paddingInline: space[4],
  paddingBlock: space[6],
  '@media': {
    [breakpoint.sm]: {
      paddingInline: space[6],
      paddingBlock: space[8],
    },
  },
});

export const card = style({
  width: '100%',
  maxWidth: '480px',
});

export const tallyRow = style({
  width: '100%',
  maxWidth: '480px',
});

export const tallyPill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: space[1],
  paddingBlock: space[1],
  paddingInline: space[3],
  borderRadius: radius.full,
  background: neutral.alpha[3],
  color: neutral.solid[12],
  fontWeight: fontWeight.medium,
  fontVariantNumeric: 'tabular-nums',
});

export const tallyPillCorrect = style({
  background: success.alpha[3],
  color: success.solid[11],
});

export const tallyPillWrong = style({
  background: danger.alpha[3],
  color: danger.solid[11],
});

export const problem = style({
  ...typeScale[8],
  fontWeight: fontWeight.bold,
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
});

export const answerInput = style({
  width: '100%',
  paddingBlock: space[3],
  paddingInline: space[4],
  borderRadius: radius[3],
  border: `1px solid ${neutral.solid[7]}`,
  background: background.surface,
  color: neutral.solid[12],
  fontSize: typeScale[6].fontSize,
  fontWeight: fontWeight.medium,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'center',
  outline: 'none',
  boxShadow: shadow[1],
  selectors: {
    '&:focus-visible': {
      borderColor: accent.solid[8],
      boxShadow: `0 0 0 2px ${accent.alpha[6]}`,
    },
  },
});

export const wrongPanel = style({
  borderRadius: radius[3],
  background: danger.alpha[3],
  color: danger.solid[11],
  paddingBlock: space[3],
  paddingInline: space[4],
});

export const difficultyOption = style({
  width: '100%',
});

export const statRow = style({
  paddingBlock: space[2],
  borderBottom: `1px solid ${neutral.solid[4]}`,
  selectors: {
    '&:last-child': {
      borderBottom: 'none',
    },
  },
});

export const statValue = style({
  fontVariantNumeric: 'tabular-nums',
});

export const accuracyNumber = style({
  ...typeScale[9],
  fontWeight: fontWeight.bold,
  fontVariantNumeric: 'tabular-nums',
  color: accent.solid[11],
});
