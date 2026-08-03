import { style } from '@vanilla-extract/css';
import { moderate, standard } from '@lib/design';

/**
 * The disclosure toggle. `flex-start` keeps the hit area hugging the
 * heading rather than stretching across the column.
 */
export const summary = style({
  alignSelf: 'flex-start',
});

/** Chevron that points right when collapsed and rotates down when open. */
export const chevron = style({
  transitionProperty: 'transform',
  transitionDuration: moderate[1],
  transitionTimingFunction: standard.productive,
  selectors: {
    'details[open] &': { transform: 'rotate(90deg)' },
  },
});
