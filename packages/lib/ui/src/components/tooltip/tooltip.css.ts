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
 * - Hover is `:hover` under `@media (hover: hover)`, not a pointer
 *   handler reading `pointerType`. The media feature describes the
 *   primary pointer, so a touch on a device that also has a mouse is
 *   let in where upstream would turn it away.
 * - The hover delay is CSS, and it's an `animation-delay` on the window
 *   rather than a timer. Nothing about it needs the component to be
 *   running, so it works before hydration.
 * - The delay is fixed at 200ms, upstream's default, and not exposed as
 *   `delayDuration` — the same call as the collision settings.
 * - No entrance animation yet. Upstream slides and fades a delayed open
 *   in; it'll compose onto the window beside the delay, sharing it.
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

/** The open signal itself, as an `animation` shorthand. */
const INERT_ANIMATION = { animation: `${open} 1s paused` };

/**
 * The open condition, written once for each hover context. They're
 * complementary, so exactly one applies, and the pair is the whole
 * definition of what open means — there's no unconditional rule
 * underneath for either to fall back on.
 *
 * The split is how a touch pointer is kept out. `:hover` sticks after
 * a tap on a touchscreen, which would leave a tooltip on screen until
 * something else was tapped, so hover only counts where the primary
 * pointer can rest on things without pressing them.
 */
const CONDITION = {
  /** Nothing to hover with. Focus is the only way in. */
  WITHOUT_HOVER: ':has(:focus-visible)',

  /** A pointer that can rest. Hover joins focus. */
  WITH_HOVER: ':has(:focus-visible), :hover',
};

/**
 * How long the window holds back before it shows. Zero unless hover is
 * what opened it. A later phase drops it back to zero while another
 * tooltip is already up, so the second one doesn't make you wait twice.
 */
export const delay = createVar();

/**
 * Not motion either: the window wears this for as long as {@link delay}
 * says, and comes out the other side. The `backwards` fill is what
 * makes it work — the animation itself takes no time at all, and
 * everything it does happens before it starts, while the delay runs
 * down.
 *
 * Hidden rather than transparent because a transparent window still
 * takes the pointer: a press over one would land on a tooltip nobody
 * can see, and the component would read it as a press inside the window
 * and decline to dismiss.
 */
const hold = keyframes({
  from: { visibility: 'hidden' },
  to: { visibility: 'hidden' },
});

/**
 * The wrapper around the trigger and its window, carrying the open
 * signal. The condition is the one above: focus resting visibly inside
 * the root, or — where there's a pointer to do it with — the pointer
 * resting anywhere inside it.
 *
 * The signal lives here rather than on the window because the window
 * gets hidden — when closed, and again when dismissed — and hiding an
 * element cancels its animations. On the root it reports the
 * stylesheet's intent, which is the thing worth reporting, and stays
 * up while the component hides the window for reasons of its own.
 */
export const root = style({
  vars: { [delay]: '0s' },
  '@media': {
    '(hover: none)': {
      selectors: {
        [`&:where(${CONDITION.WITHOUT_HOVER})`]: INERT_ANIMATION,
      },
    },

    '(hover: hover)': {
      selectors: {
        [`&:where(${CONDITION.WITH_HOVER})`]: INERT_ANIMATION,

        // Only a hover waits. The two don't overlap, so focus arriving
        // on a trigger the pointer is already resting on shortens the
        // delay instead of racing it: the duration drops to zero and
        // the window shows on the spot, wherever the wait had got to.
        //
        // A literal rather than a motion token: waiting isn't motion,
        // and the tokens collapse to zero under reduced motion, which
        // would delete the wait rather than shorten it.
        '&:where(:hover:not(:has(:focus-visible)))': {
          vars: { [delay]: '200ms' },
        },
      },
    },
  },
});

/**
 * The positioned box. Always in the DOM, and the stylesheet decides
 * whether it shows: hidden unless the root is open by the condition
 * above. `:focus-visible` is the browser's own call on whether the
 * focus came from the keyboard, so a pointer press on the trigger
 * never opens it.
 *
 * The hover half reaches the window too, since the window sits inside
 * the root: the pointer can travel from the trigger onto the tooltip
 * without closing it. It can't cross the gap between them, which is
 * what a grace area is for.
 *
 * Between the stylesheet deciding to open and the window turning up
 * sits {@link hold}, for as long as {@link delay} says. Hiding cancels
 * it, which is how a visit that ends early leaves nothing behind: the
 * next one starts its wait from the beginning.
 *
 * Carries the surface color as `color` so the arrow, which fills with
 * `currentColor`, matches the surface without a class of its own. The
 * text sets its own color back.
 */
export const window = style({
  color: neutral.solid[12],
  animation: `${hold} 0s ${delay} backwards`,
  '@media': {
    '(hover: none)': {
      selectors: {
        [`${root}:where(:not(${CONDITION.WITHOUT_HOVER})) > &`]: {
          display: 'none',
        },
      },
    },

    '(hover: hover)': {
      selectors: {
        [`${root}:where(:not(${CONDITION.WITH_HOVER})) > &`]: {
          display: 'none',
        },
      },
    },
  },
  selectors: {
    // Dismissed: the component's veto while the stylesheet still wants
    // the window open. Hiding it doesn't disturb the open signal, which
    // rides on the root, so the veto can wait there for the pointer and
    // focus to leave.
    '&:where([data-dismissed])': {
      display: 'none',
    },
  },
});
