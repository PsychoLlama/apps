import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

// Fill the ScrollArea viewport vertically so the empty-state
// `placeholder` (flex:1) has a definite height to grow into. Center
// the section horizontally up to its content cap so the empty copy
// doesn't sit off-axis on wide viewports.
export const root = style({
  width: '100%',
  maxWidth: '52rem',
  minHeight: '100%',
  marginInline: 'auto',
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
