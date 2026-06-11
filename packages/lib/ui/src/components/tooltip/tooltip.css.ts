/**
 * Tooltip styles.
 *
 * Ported from Radix UI Themes Tooltip (which styles the Tooltip primitive).
 * Deviations:
 * - Background/foreground ride `neutral.solid[12]` / `neutral.solid[1]`
 *   instead of Radix's literal `--gray-12` / `--gray-1`. Same high-contrast
 *   inverted panel, but it tracks the active accent-tinted neutral scale and
 *   flips per color scheme for free.
 * - Entrance motion consolidates Radix's hand-tuned `140ms cubic-bezier(…)`
 *   onto the design-system motion scale (`moderate[1]` + `entrance.productive`),
 *   which also collapses to `0s` under `prefers-reduced-motion`. Only the
 *   `delayed-open` state animates — an `instant-open` (skip-delay) tooltip
 *   appears without motion, matching Radix.
 * - No exit animation. The panel unmounts on close rather than threading a
 *   `Presence` machine through Solid; tooltips dismiss instantly.
 * - The arrow is a rotated square rather than Radix's SVG, sized to
 *   `space[2]` and filled with the panel color so it reads as a seamless
 *   nub. Position is driven by floating-ui's `arrow` middleware.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 */

import { keyframes, style } from '@vanilla-extract/css';
import {
  entrance,
  fontFamily,
  moderate,
  neutral,
  radius,
  space,
  typeScale,
} from '@lib/design';

/**
 * Arrow edge length. `space[2]` is 8px — kept in lockstep with
 * `ARROW_SIZE_PX` in `tooltip.tsx`, which feeds the same number to
 * floating-ui's arrow middleware so the CSS box and the computed offset
 * agree.
 */
const ARROW_SIZE = space[2];

// A 2px slide toward the trigger paired with a fade, one keyframe per
// side so the panel reads as emerging from the control it describes.
const slideFromTop = keyframes({
  from: { opacity: 0, transform: 'translateY(2px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});
const slideFromBottom = keyframes({
  from: { opacity: 0, transform: 'translateY(-2px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});
const slideFromLeft = keyframes({
  from: { opacity: 0, transform: 'translateX(2px)' },
  to: { opacity: 1, transform: 'translateX(0)' },
});
const slideFromRight = keyframes({
  from: { opacity: 0, transform: 'translateX(-2px)' },
  to: { opacity: 1, transform: 'translateX(0)' },
});

export const content = style({
  // `position: fixed` + zeroed inset; floating-ui writes the real
  // `top`/`left` each frame via `autoUpdate`.
  position: 'fixed',
  top: 0,
  left: 0,
  boxSizing: 'border-box',
  // Cap the panel so a long label wraps instead of stretching across the
  // viewport. Not a token category — purely a layout ceiling.
  maxWidth: '20rem',
  width: 'max-content',
  padding: `${space[1]} ${space[2]}`,
  backgroundColor: neutral.solid[12],
  color: neutral.solid[1],
  borderRadius: radius[2],
  fontFamily: fontFamily.body,
  fontSize: typeScale[1].fontSize,
  lineHeight: typeScale[1].bodyLineHeight,
  letterSpacing: typeScale[1].letterSpacing,
  // Labels aren't selectable affordances, and the panel must never
  // intercept the pointer — that would let it sit between the cursor and
  // the trigger and flicker the open/close.
  userSelect: 'none',
  pointerEvents: 'none',
  // No `z-index` (it's banned, and every value compounds the stacking
  // graph). The panel portals to the end of `<body>` as a positioned
  // element, so it already paints above normal-flow content by source
  // order without entering the z-index arms race.

  selectors: {
    '&:where([data-state="delayed-open"][data-side="top"])': {
      animation: `${slideFromTop} ${moderate[1]} ${entrance.productive}`,
    },
    '&:where([data-state="delayed-open"][data-side="bottom"])': {
      animation: `${slideFromBottom} ${moderate[1]} ${entrance.productive}`,
    },
    '&:where([data-state="delayed-open"][data-side="left"])': {
      animation: `${slideFromLeft} ${moderate[1]} ${entrance.productive}`,
    },
    '&:where([data-state="delayed-open"][data-side="right"])': {
      animation: `${slideFromRight} ${moderate[1]} ${entrance.productive}`,
    },
  },
});

export const arrow = style({
  position: 'absolute',
  width: ARROW_SIZE,
  height: ARROW_SIZE,
  backgroundColor: neutral.solid[12],
  // Rotate a square into a diamond; floating-ui pins it to the panel
  // edge so only the outward triangle pokes past the surface.
  transform: 'rotate(45deg)',
});
