/**
 * ScrollArea styles.
 *
 * Native-CSS port of Radix UI Themes ScrollArea. The viewport is a
 * single `<div>` with `overflow: auto` (or `scroll`) and styled
 * scrollbars via `::-webkit-scrollbar` (Chromium/Safari) and
 * `scrollbar-width` / `scrollbar-color` (Firefox).
 *
 * Deviations from Radix:
 * - No JS scrollbar machinery. Behavior is whatever the platform
 *   offers natively — overlay-style scrollbars on macOS/iOS that
 *   auto-hide; persistent ones on Windows/Linux/Android.
 * - `type='hover'` is implemented in pure CSS by transitioning
 *   `scrollbar-color` between transparent and the thumb token. The
 *   fade is smooth wherever the spec-tracked syntax is supported
 *   (Chromium 121+, Firefox 64+, Safari 18.2+). The legacy
 *   `::-webkit-scrollbar-thumb:hover` color shift (alpha[8] →
 *   alpha[9] when the user points at the thumb itself) doesn't
 *   transition, but the in/out fade — the thing the prop is named
 *   after — does animate.
 * - `type='scroll'` (show during scroll, fade after delay) still
 *   needs JS — `@container scroll-state(scrolled: ...)` reports the
 *   last scroll direction, not "is the user actively scrolling," and
 *   there's no CSS-only timeout. Recorded as deferred.
 * - No `scrollHideDelay`. The user agent controls fade timing.
 * - No corner element. `::-webkit-scrollbar-corner` paints the
 *   intersection automatically; we just transparent it out.
 * - The thumb is pill-shaped at every size. Radix's
 *   `--scrollarea-scrollbar-border-radius: max(radius-1, radius-full)`
 *   resolves to `radius-full` in every size variant, so this
 *   component drops the `radius` prop and hard-codes a pill thumb.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/scroll-area.css
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import { moderate, neutral, radius, space, standard } from '@lib/design';

// Scrollbar track width, fed by the `size` variant and read by the
// WebKit pseudo-element rules. Firefox only honors `thin | auto |
// none` for `scrollbar-width`, so size variants don't move on Firefox.
const scrollbarSize = createVar();

// Thumb color, parameterized so the `revealOnHover` variant can swap
// it to transparent without re-declaring the rule. Firefox transitions
// `scrollbar-color`, so animating this var produces a smooth fade.
const thumbColor = createVar();

export const root = style({
  width: '100%',
  height: '100%',
  // Firefox styling. `thin` is closest to Radix's slim scrollbar; the
  // WebKit rules below set the precise width for Chromium/Safari.
  scrollbarWidth: 'thin',
  scrollbarColor: `${thumbColor} transparent`,
  // Stop Chrome's two-finger swipe-back gesture from intercepting
  // horizontal scroll inside the viewport (matches upstream).
  overscrollBehaviorX: 'contain',
  // Default thumb. `revealOnHover` overrides this to transparent and
  // swaps it back on :hover/:focus-within.
  vars: { [thumbColor]: neutral.alpha[8] },
  // `scrollbar-color` is animatable; the WebKit pseudo isn't.
  transitionProperty: 'scrollbar-color',
  transitionDuration: moderate[2],
  transitionTimingFunction: standard.productive,

  selectors: {
    '&::-webkit-scrollbar': {
      width: scrollbarSize,
      height: scrollbarSize,
    },
    // Transparent track lets the parent surface show through, matching
    // the overlay-scrollbar look. Radix's tinted track reads as a frame
    // around content when the scrollbar sits flush with the viewport.
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: thumbColor,
      borderRadius: radius.full,
      // `background-clip: padding-box` + transparent border is the
      // canonical recipe for inset scrollbar thumbs — `margin` is
      // ignored on `::-webkit-scrollbar-thumb`. The border keeps the
      // thumb visually slim while the scrollbar hosts hover/grab
      // events along its full width.
      border: `2px solid transparent`,
      backgroundClip: 'padding-box',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: neutral.alpha[9],
    },
    '&::-webkit-scrollbar-corner': {
      backgroundColor: 'transparent',
    },
  },
});

// Hide the scrollbar until the user hovers the viewport (or focuses
// something inside via keyboard). The Firefox path animates via the
// `scrollbar-color` transition declared on `root`; the WebKit path
// snaps thumb visibility because `::-webkit-scrollbar-thumb` doesn't
// honor `transition`.
export const revealOnHover = style({
  vars: { [thumbColor]: 'transparent' },

  selectors: {
    '&:where(:hover, :focus-within)': {
      vars: { [thumbColor]: neutral.alpha[8] },
    },
  },
});

export const size = styleVariants({
  1: { vars: { [scrollbarSize]: space[2] } },
  2: { vars: { [scrollbarSize]: space[3] } },
  3: { vars: { [scrollbarSize]: space[4] } },
});

// `overflow-x` and `overflow-y` split so `scrollbars` × `type`
// compose without a 6-cell matrix. The component picks `auto`,
// `scroll`, or `hidden` per axis depending on which axes the caller
// enables and whether they want overflow-only or always-on tracks.

export const overflowX = styleVariants({
  auto: { overflowX: 'auto' },
  scroll: { overflowX: 'scroll' },
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
