/**
 * Animation fixtures for `presence.test.browser.tsx`. Durations are
 * raw and short on purpose — these exist to finish fast in a headless
 * browser, not to look right.
 */

import { keyframes, style } from '@vanilla-extract/css';

const enter = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const exit = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });

/** Distinct entrance and exit animations per open state. */
export const animated = style({
  selectors: {
    '&[data-state="open"]': { animation: `${enter} 50ms linear` },
    '&[data-state="closed"]': { animation: `${exit} 100ms linear` },
  },
});

/** Entrance only — closing applies no animation at all. */
export const entranceOnly = style({
  selectors: {
    '&[data-state="open"]': { animation: `${enter} 50ms linear` },
  },
});

/** One long animation regardless of state — never exit motion. */
export const constant = style({
  animation: `${enter} 10s linear`,
});

/** Exit via transition instead of animation. */
export const transitioned = style({
  opacity: 1,
  // Raw, fast fixture motion by design; see the module doc.
  // eslint-disable-next-line custom/require-design-tokens
  transition: 'opacity 100ms linear',
  selectors: {
    '&[data-state="closed"]': { opacity: 0 },
  },
});
