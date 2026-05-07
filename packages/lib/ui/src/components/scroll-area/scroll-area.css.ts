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
 * - `type` collapses to `'auto'` and `'always'`. The Radix
 *   `'scroll'` (show on scroll, fade out) and `'hover'` (show on
 *   hover only) modes need JS to schedule fade timers — recorded as
 *   deferred deviations.
 * - No `scrollHideDelay`. The user agent controls fade timing.
 * - No fade-in/fade-out animation. Native scrollbars don't expose
 *   animation hooks.
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
import { neutral, radius, space } from '@lib/design';

// Scrollbar track width, fed by the `size` variant and read by the
// WebKit pseudo-element rules. Firefox only honors `thin | auto |
// none` for `scrollbar-width`, so size variants don't move on Firefox.
const scrollbarSize = createVar();

export const root = style({
  width: '100%',
  height: '100%',
  // Firefox styling. `thin` is closest to Radix's slim scrollbar; the
  // WebKit rules below set the precise width for Chromium/Safari.
  scrollbarWidth: 'thin',
  scrollbarColor: `${neutral.alpha[8]} transparent`,
  // Stop Chrome's two-finger swipe-back gesture from intercepting
  // horizontal scroll inside the viewport (matches upstream).
  overscrollBehaviorX: 'contain',

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
      backgroundColor: neutral.alpha[8],
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

export const overflowY = styleVariants({
  auto: { overflowY: 'auto' },
  scroll: { overflowY: 'scroll' },
  hidden: { overflowY: 'hidden' },
});
