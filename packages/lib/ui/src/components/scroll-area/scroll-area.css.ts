/**
 * ScrollArea styles.
 *
 * Native-CSS port of Radix UI Themes ScrollArea. The viewport is a
 * single element with `overflow: auto` (or `scroll`) and styled
 * scrollbars via the CSS Scrollbars Module Level 1 properties —
 * `scrollbar-color` and `scrollbar-width`. Both became Baseline 2025
 * (Chromium 121+, Firefox 64+, Safari 18.2+), so one rule set drives
 * all three engines identically.
 *
 * Deviations from Radix:
 * - No JS scrollbar machinery. Behavior is whatever the platform
 *   offers natively — overlay-style scrollbars on macOS/iOS that
 *   auto-hide; persistent ones on Windows/Linux/Android.
 * - `type='hover'` is implemented in pure CSS by transitioning
 *   `scrollbar-color` between transparent and the thumb token.
 *   `scrollbar-color` interpolates as `<color>` per spec, so the fade
 *   animates everywhere the property itself is supported.
 * - `type='scroll'` (show during scroll, fade after delay) still
 *   needs JS — `@container scroll-state(scrolled: ...)` reports the
 *   last scroll direction, not "is the user actively scrolling," and
 *   there's no CSS-only timeout. Recorded as deferred.
 * - No `scrollHideDelay`. The user agent controls fade timing.
 * - The thumb is pill-shaped at every size. Radix's
 *   `--scrollarea-scrollbar-border-radius: max(radius-1, radius-full)`
 *   resolves to `radius-full` in every size variant, so this
 *   component drops the `radius` prop and hard-codes a pill thumb.
 *   (Pill shape is implicit in `scrollbar-width: thin | auto` — the
 *   browser owns thumb geometry; we only choose the track width.)
 * - `size` collapses to two visible widths instead of Radix's three.
 *   CSS Scrollbars Module Level 1 only defines `auto | thin | none`
 *   for `scrollbar-width`, and modern Chromium ignores the legacy
 *   `::-webkit-scrollbar { width }` once `scrollbar-color` is set —
 *   so three sizes would render as two everywhere anyway. We map
 *   `size=1` to `thin` and `size=2` to platform-default `auto`.
 * - The children reset is softer than upstream's
 *   `display: block !important; width: fit-content; flex-grow: 1`.
 *   We drop the `display: block !important` so callers can put a
 *   `<Flex direction="row">` directly inside ScrollArea and still get
 *   horizontal scrolling — Radix's reset would demote that flex to
 *   block and stack the row vertically. `width: fit-content` and
 *   `flex-grow: 1` survive because they only affect sizing, not
 *   layout mode.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/scroll-area.css
 */

import {
  createVar,
  // eslint-disable-next-line no-restricted-imports -- needed for the children reset; V-E rejects `& > *` in regular `style()` because it acts at a distance, so a globalStyle is the only path. Scoped to `${root} > *` so the rule can't leak past this component.
  globalStyle,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import { accent, moderate, neutral, standard } from '@lib/design';

// Thumb color, parameterized so the `revealOnHover` variant can swap
// it to transparent without re-declaring the rule. `scrollbar-color`
// transitions, so animating this var produces a smooth fade.
const thumbColor = createVar();

export const root = style({
  // Flex column root so the children reset's `flex-grow: 1` can fill
  // the viewport vertically when content is short. Matches upstream.
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  scrollbarColor: `${thumbColor} transparent`,
  // Default thumb. `revealOnHover` overrides this to transparent and
  // swaps it back on :hover/:focus-within.
  vars: { [thumbColor]: neutral.alpha[8] },
  // `scrollbar-color` is animatable per the Scrollbars Module spec.
  transitionProperty: 'scrollbar-color',
  transitionDuration: moderate[2],
  transitionTimingFunction: standard.productive,

  selectors: {
    // Modern browsers auto-promote scroll containers to focusable when
    // there's no focusable child inside, so the area is reachable via
    // keyboard. Paint a focus ring so it's visible when it is.
    '&:where(:focus-visible)': {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '-2px',
    },
  },
});

// Children reset — applied via `globalStyle` because Vanilla Extract
// won't compile `& > *` in a regular `style` (it's an action-at-a-
// distance selector). `width: fit-content` lets the immediate child
// extend past the viewport when its intrinsic min-content is wider
// (which is how horizontal scroll works without consumer effort).
// `flex-grow: 1` fills the viewport vertically when content is short
// so the surface paints edge-to-edge. Display is intentionally not
// touched — see module docstring.
globalStyle(`${root} > *`, {
  width: 'fit-content',
  flexGrow: 1,
});

// Hide the scrollbar until the user hovers the viewport (or focuses
// something inside via keyboard). The fade rides on the
// `scrollbar-color` transition declared on `root` and animates
// uniformly across Chromium 121+, Firefox 64+, and Safari 18.2+.
export const revealOnHover = style({
  vars: { [thumbColor]: 'transparent' },

  selectors: {
    '&:where(:hover, :focus-within)': {
      vars: { [thumbColor]: neutral.alpha[8] },
    },
  },
});

// `scrollbar-width` accepts only `auto | thin | none` per spec, so
// these are the two visible widths the component can offer. `thin` is
// browser-defined (~6–8px on Chromium/Firefox); `auto` matches the
// platform's classic scrollbar (~14–17px on Chromium, GTK-default on
// Firefox).
export const size = styleVariants({
  1: { scrollbarWidth: 'thin' },
  2: { scrollbarWidth: 'auto' },
});

// `overflow-x` and `overflow-y` split so `scrollbars` × `type`
// compose without a 6-cell matrix. The component picks `auto`,
// `scroll`, or `hidden` per axis depending on which axes the caller
// enables and whether they want overflow-only or always-on tracks.

// `overscroll-behavior-x: contain` only matters when the x-axis can
// scroll — without it, Chrome's two-finger swipe-back gesture
// intercepts horizontal scroll inside the viewport.
export const overflowX = styleVariants({
  auto: { overflowX: 'auto', overscrollBehaviorX: 'contain' },
  scroll: { overflowX: 'scroll', overscrollBehaviorX: 'contain' },
  hidden: { overflowX: 'hidden' },
});

// Reserve gutter space only when the y-axis can actually scroll, so
// horizontal-only viewports on classic-scrollbar platforms don't paint
// an unused inline-end strip. No-op on macOS/iOS overlay scrollbars.
export const overflowY = styleVariants({
  auto: { overflowY: 'auto', scrollbarGutter: 'stable' },
  scroll: { overflowY: 'scroll', scrollbarGutter: 'stable' },
  hidden: { overflowY: 'hidden' },
});
