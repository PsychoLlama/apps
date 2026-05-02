/**
 * Container styles.
 *
 * Ported from Radix UI Themes Container. Deviations:
 * - Max-widths expressed in rem (not px) so they scale with the user's
 *   root font size — same rationale our spacing scale uses.
 * - `align` prop renamed from `left | center | right` to
 *   `start | center | end` for parity with our `Grid` API.
 * - `display` prop dropped (responsive object props don't fit our
 *   variant model; consumers can hide via class or wrapping markup).
 *
 * @see https://www.radix-ui.com/themes/docs/components/container
 */

import { style, styleVariants } from '@vanilla-extract/css';

// Same numeric scale Radix ships (448 / 688 / 880 / 1136 px), expressed
// in rem so the cap tracks the root font size. No matching design token
// exists — these are layout maxima, not themed values.
const containerMaxWidth = {
  1: '28rem',
  2: '43rem',
  3: '55rem',
  4: '71rem',
} as const;

// `alignItems` is owned by the `align` variant below — the component
// always applies one (default `center`), so leaving it off `base`
// removes any cascade ambiguity if rule order ever shifted.
export const base = style({
  display: 'flex',
  boxSizing: 'border-box',
  flexDirection: 'column',
  flexShrink: 0,
  flexGrow: 1,
});

export const align = styleVariants({
  start: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
});

export const inner = style({
  width: '100%',
});

export const size = styleVariants(containerMaxWidth, (value) => ({
  maxWidth: value,
}));
