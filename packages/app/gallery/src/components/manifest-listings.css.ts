import { style } from '@vanilla-extract/css';
import { moderate, space, standard } from '@lib/design';

/**
 * A group disclosure. Spacing between groups tracks the open state: expanded
 * groups breathe at section rhythm, collapsed groups stack tightly so a run of
 * closed headers reads as a compact list.
 */
export const group = style({
  marginBottom: space[4],
  selectors: {
    '&[open]': { marginBottom: space[9] },
    '&:last-child': { marginBottom: 0 },
  },
});

/**
 * The disclosure toggle. `flex-start` keeps the hit area hugging the heading
 * rather than stretching across the column.
 */
export const summary = style({
  alignSelf: 'flex-start',
});

/** Chevron that points right when collapsed and rotates down when the group is open. */
export const chevron = style({
  transitionProperty: 'transform',
  transitionDuration: moderate[1],
  transitionTimingFunction: standard.productive,
  selectors: {
    'details[open] &': { transform: 'rotate(90deg)' },
  },
});
