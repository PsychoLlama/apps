import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';

export const label = style({
  width: '88px',
  flexShrink: 0,
});

export const control = style({
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: space[2],
});
