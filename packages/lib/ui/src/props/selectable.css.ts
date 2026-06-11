import { style } from '@vanilla-extract/css';

/** Opt text selection in. */
export const selectable = style({
  userSelect: 'text',
});

/** Opt text selection out. */
export const unselectable = style({
  userSelect: 'none',
});
