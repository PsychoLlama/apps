import { style } from '@vanilla-extract/css';
import { moderate, standard } from '@lib/design';

/**
 * A group's disclosure toggle. Sits the chevron beside the heading with a
 * pointer affordance and drops the native marker — the chevron stands in for
 * it (and a flex summary suppresses the marker anyway).
 */
export const summary = style({
  cursor: 'pointer',
  listStyle: 'none',
  selectors: {
    '&::-webkit-details-marker': { display: 'none' },
  },
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
