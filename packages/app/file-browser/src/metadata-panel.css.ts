import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

export const root = style({
  width: '100%',
  maxWidth: '52rem',
});

export const placeholder = style({
  alignItems: 'center',
  justifyContent: 'center',
  flex: '1 1 auto',
  minHeight: 0,
  textAlign: 'center',
});

export const path = style({
  paddingBlock: space[2],
  paddingInline: space[3],
  borderRadius: space[1],
  backgroundColor: neutral.alpha[3],
  wordBreak: 'break-all',
});
