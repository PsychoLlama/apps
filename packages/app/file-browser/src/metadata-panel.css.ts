import { style } from '@vanilla-extract/css';
import { breakpoint, neutral, space } from '@lib/design';

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

// DataList + Preview share the bottom of the metadata pane. At
// narrow widths the preview lifts to the top so it's the first
// thing visible when there's not enough room to fit the property
// list beside it; at `lg` and up they go side-by-side with
// properties on the left and preview filling the rest.
export const split = style({
  flexDirection: 'column-reverse',
  alignItems: 'stretch',
  '@media': {
    [breakpoint.lg]: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
  },
});

export const metaCol = style({
  flexShrink: 0,
  '@media': {
    [breakpoint.lg]: {
      width: '24rem',
    },
  },
});

export const previewCol = style({
  flex: '1 1 auto',
  minWidth: 0,
});
