/**
 * Tooltip styles.
 *
 * Ported from Radix UI Themes Tooltip. The surface is the floating
 * primitive's body, so padding and radius arrive as props there; what's
 * left here is the paint.
 *
 * Deviations from Radix:
 * - `gray-12` / `gray-1` map onto `neutral.solid[12]` / `neutral.solid[1]`.
 * - Skips `highContrast` (deferred deviation).
 * - No entrance animation yet. Upstream slides and fades a delayed open
 *   in; that lands with the hover delay.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 */

import { createVar, fallbackVar, keyframes, style } from '@vanilla-extract/css';
import { neutral } from '@lib/design';

/**
 * Any CSS width the surface wraps at. Assigned inline from the
 * `maxWidth` prop; unset falls back to Themes' 360px.
 */
export const maxWidth = createVar();

/** The surface. Padding and radius are props. */
export const content = style({
  backgroundColor: neutral.solid[12],
  maxWidth: fallbackVar(maxWidth, '360px'),
});

/**
 * The visible copy. A tooltip is chrome, not content, so it reads as a
 * label: default cursor and, via `selectable={false}`, no selection.
 */
export const text = style({
  color: neutral.solid[1],
  cursor: 'default',
});

/**
 * Not motion: an empty animation the open window carries so the
 * stylesheet can tell the component when it shows and hides. Starting
 * fires `animationstart`; `display: none` cancels it, which fires
 * `animationcancel`. Paused, so it never ticks or ends on its own, and
 * its duration is a literal rather than a motion token: the tokens
 * collapse to `0ms` under reduced motion, and a `0ms` animation ends
 * the instant it starts, leaving nothing to cancel.
 *
 * Two empty stops rather than no stops: Vanilla Extract emits nothing
 * for an empty keyframes object, and an animation naming a missing
 * `@keyframes` never starts.
 */
export const open = keyframes({ from: {}, to: {} });

/**
 * The positioned box. Always in the DOM, and the stylesheet decides
 * whether it shows: hidden unless focus rests visibly inside the
 * floating root, which holds the trigger and nothing else focusable.
 * `:focus-visible` is the browser's own call on whether the focus came
 * from the keyboard, so a pointer press on the trigger never opens it.
 *
 * Carries the surface color as `color` so the arrow, which fills with
 * `currentColor`, matches the surface without a class of its own. The
 * text sets its own color back.
 */
export const window = style({
  color: neutral.solid[12],
  animation: `${open} 1s paused`,
  selectors: {
    ':where(:not(:has(:focus-visible))) > &': {
      display: 'none',
    },
  },
});
