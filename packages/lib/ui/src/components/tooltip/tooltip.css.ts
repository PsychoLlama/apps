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
 * - The wait and the entrance are one animation, so the window can't
 *   show up without arriving. Upstream gates its entrance on
 *   `data-state="delayed-open"`; here the entrance lasts as long as the
 *   wait warranted, which is nothing whenever the wait was.
 * - Motion rides the scale: `moderate[1]` (upstream 140ms) with
 *   `entrance.productive`, against upstream's own `cubic-bezier(0.16,
 *   1, 0.3, 1)` — a harder deceleration than ours. Reduced motion needs
 *   no media query here; the duration token collapses on its own.
 * - The slide is `space[1]` rather than a literal 4px, so it scales with
 *   the reader's font size. Same distance at the default.
 * - A tooltip that shouldn't be hovered is see-through to the pointer
 *   rather than closing on the way out. Upstream's content is still
 *   solid under `disableHoverableContent`; ours lets the page through.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 */

import { createVar, fallbackVar, keyframes, style } from '@vanilla-extract/css';
import { entrance, moderate, neutral, space } from '@lib/design';
import * as floating from '../_internal/floating-ui/index.css';

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
 * How long the window takes to arrive once the wait is over. Zero
 * wherever {@link delay} is, which is how only a hovered tooltip
 * animates in: one that was already there in spirit — focused, or
 * following another that was just up — shouldn't make an entrance.
 */
export const duration = createVar();

// Which way the window travels on the way in, per axis: out of the
// trigger, so the motion reads as coming from the thing described.
// Both stay at zero until `data-side` says which axis faces it.
const slideX = createVar();
const slideY = createVar();

/**
 * The window arriving: everything between the stylesheet deciding to
 * open and the tooltip being there. {@link delay} of nothing at all,
 * then {@link duration} of slide and fade.
 *
 * The `backwards` fill is what makes the first half work — the window
 * wears this opening frame for as long as the delay runs, before the
 * animation has started. That frame hides with `visibility` rather than
 * `opacity` because a transparent window still takes the pointer: a
 * press over one would land on a tooltip nobody can see, and the
 * component would read it as a press inside the window and decline to
 * dismiss. Once running, `visibility` flips on the first frame and the
 * fade is `opacity`'s.
 */
const enter = keyframes({
  from: {
    visibility: 'hidden',
    opacity: 0,
    transform: `translate(${slideX}, ${slideY}) scale(0.97)`,
  },
  to: {
    visibility: 'visible',
    opacity: 1,
    transform: 'translate(0, 0) scale(1)',
  },
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
  vars: { [delay]: '0s', [duration]: '0s' },
  selectors: {
    // Unhoverable: the surface stops catching the pointer, so there's
    // nothing inside the root to rest on but the trigger.
    '&:where([data-hoverable="false"])': {
      vars: { [floating.pointerEvents]: 'none' },
    },
  },
  '@media': {
    '(hover: none)': {
      selectors: {
        [`&:where(${CONDITION.WITHOUT_HOVER})`]: INERT_ANIMATION,
      },
    },

    '(hover: hover)': {
      selectors: {
        [`&:where(${CONDITION.WITH_HOVER})`]: INERT_ANIMATION,

        // Only a hover waits, and only a hover animates in. The two
        // conditions don't overlap, so focus arriving on a trigger the
        // pointer is already resting on shortens the wait instead of
        // racing it: both values drop to zero and the window is simply
        // there, from wherever the arrival had got to.
        //
        // The wait is a literal rather than a motion token: waiting
        // isn't motion, and the tokens collapse to zero under reduced
        // motion, which would delete the wait rather than shorten it.
        // The entrance is motion, and collapsing is what it should do.
        '&:where(:hover:not(:has(:focus-visible)))': {
          vars: { [delay]: '200ms', [duration]: moderate[1] },
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
 * what a grace area is for — and it can't do any of it when the tooltip
 * isn't hoverable, where the pointer goes straight through.
 *
 * Between the stylesheet deciding to open and the tooltip being there
 * sits {@link enter}. Hiding cancels it, which is how a visit that ends
 * early leaves nothing behind: the next one starts over from the top.
 *
 * The arrival travels on `transform`, which the floating primitive
 * leaves to consumers — placement rides on `translate` — out of the
 * `transform-origin` it already points at the anchor. So the arrow and
 * the surface arrive together, growing out of the trigger's edge.
 *
 * Carries the surface color as `color` so the arrow, which fills with
 * `currentColor`, matches the surface without a class of its own. The
 * text sets its own color back.
 */
export const window = style({
  color: neutral.solid[12],
  vars: { [slideX]: '0px', [slideY]: '0px' },
  animation: `${enter} ${duration} ${delay} ${entrance.productive} backwards`,
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
    // Which way is "out of the trigger". `data-side` is the resolved
    // side, so a window that flipped to dodge an edge slides out of the
    // side it actually landed on.
    '&:where([data-side="top"])': { vars: { [slideY]: space[1] } },
    '&:where([data-side="bottom"])': {
      vars: { [slideY]: `calc(-1 * ${space[1]})` },
    },
    '&:where([data-side="left"])': { vars: { [slideX]: space[1] } },
    '&:where([data-side="right"])': {
      vars: { [slideX]: `calc(-1 * ${space[1]})` },
    },

    // Dismissed: the component's veto while the stylesheet still wants
    // the window open. Hiding it doesn't disturb the open signal, which
    // rides on the root, so the veto can wait there for the pointer and
    // focus to leave.
    '&:where([data-dismissed])': {
      display: 'none',
    },
  },
});
