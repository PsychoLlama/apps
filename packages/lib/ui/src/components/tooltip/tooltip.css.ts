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
 * Not motion: an empty animation the root carries while the stylesheet
 * considers the tooltip open, so it can tell the component so.
 * Applying it fires `animationstart`; dropping it fires
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
 * The wrapper around the trigger and its window, carrying the open
 * signal. The condition is the one below: focus resting visibly inside
 * the root, which holds the trigger and nothing else focusable.
 *
 * The signal lives here rather than on the window because the window
 * gets hidden — when closed, and again when dismissed — and hiding an
 * element cancels its animations. On the root it reports the
 * stylesheet's intent, which is the thing worth reporting, and stays
 * up while the component hides the window for reasons of its own.
 */
export const root = style({
  selectors: {
    '&:where(:has(:focus-visible))': {
      animation: `${open} 1s paused`,
    },
  },
});

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
  selectors: {
    [`${root}:where(:not(:has(:focus-visible))) > &`]: {
      display: 'none',
    },

    // Dismissed: the component's veto while the stylesheet still wants
    // the window open. Hiding it doesn't disturb the open signal, which
    // rides on the root, so the veto can wait there for focus to leave.
    '&:where([data-dismissed])': {
      display: 'none',
    },
  },
});
