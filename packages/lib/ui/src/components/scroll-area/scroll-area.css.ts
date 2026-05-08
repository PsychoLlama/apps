/**
 * ScrollArea styles.
 *
 * Ported from Radix UI Themes ScrollArea. Deviations:
 * - Visibility transitions ride a single `opacity` rule keyed off
 *   `data-state`. Radix runs a paired keyframe fade — the version
 *   here is one declaration shorter and stays in cascade.
 * - Corner clearance flows through V-E-managed `cornerWidth` and
 *   `cornerHeight` `createVar()` slots fed by `assignInlineVars`.
 *   Radix names the same vars `--radix-scroll-area-*` and assigns
 *   them via raw inline style.
 * - Drops the dead `data-radius` selector. Sizes 1–3 used to lock
 *   `border-radius: max(--radius-1, --radius-full)` regardless of
 *   the prop; we honor `radius` directly via a `styleVariants`
 *   block so the API isn't decorative.
 * - Scrollbar margin contract vars live in `scroll-area.vars.css.ts`
 *   and resolve via `fallbackVar(varName, space[1])` per side per
 *   orientation. Radix declares the same eight names on the theme
 *   root and reads them through raw `var()`. Same shape, exposed via
 *   V-E so consumers don't have to know the CSS variable name string.
 *
 * @see https://www.radix-ui.com/themes/docs/components/scroll-area
 */

import {
  createVar,
  fallbackVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import {
  accent,
  fast,
  neutral,
  radius as radiusToken,
  space,
  standard,
} from '@lib/design';
import {
  horizontalScrollbarMarginBottom,
  horizontalScrollbarMarginLeft,
  horizontalScrollbarMarginRight,
  horizontalScrollbarMarginTop,
  verticalScrollbarMarginBottom,
  verticalScrollbarMarginLeft,
  verticalScrollbarMarginRight,
  verticalScrollbarMarginTop,
} from './scroll-area.vars.css';

// Geometry vars filled by the `size` and `radius` blocks.
const scrollbarSize = createVar();
const scrollbarRadius = createVar();

// Cross-axis offsets fed by the component when both scrollbars are
// visible — keeps each scrollbar from overlapping the other.
export const cornerWidth = createVar();
export const cornerHeight = createVar();

// --- Root ---

export const root = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
});

// --- Viewport ---
//
// Native scrollbars are hidden cross-browser; the custom scrollbars
// over-paint them. `-webkit-overflow-scrolling: touch` keeps the
// momentum scroll on iOS that the hidden native scrollbar would
// otherwise suppress.

export const viewport = style({
  width: '100%',
  height: '100%',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  // Restore iOS Safari momentum scrolling. Hiding the native bar
  // suppresses the default; this property reinstates it. Deprecated
  // but harmless on browsers that ignore it.
  WebkitOverflowScrolling: 'touch',

  // Stop Chrome's two-finger trackpad swipe from triggering
  // browser back/forward navigation when the viewport is
  // horizontally scrollable. Applied unconditionally — `contain`
  // is a no-op when there's nothing to scroll, and the alternative
  // (`:has(...)` against the sibling scrollbar) doesn't match
  // because the scrollbar isn't a descendant of the viewport.
  overscrollBehaviorX: 'contain',

  selectors: {
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
});

// --- Focus ring ---
//
// A sibling overlay paints a focus ring on top of the viewport when
// it lands `:focus-visible` — keyboard users can tab onto scrollable
// regions in some browsers (Firefox arrow-scroll) and need a visual
// cue. The element is always present and positioned out of flow; the
// outline only shows when the prior viewport is `:focus-visible`.

export const viewportFocusRing = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',

  selectors: {
    [`${viewport}:where(:focus-visible) + &`]: {
      outline: `2px solid ${accent.solid[8]}`,
      outlineOffset: '-2px',
    },
  },
});

// --- Content ---
//
// `display: table` makes the wrapper hug its children in both axes so
// `scrollWidth`/`scrollHeight` reflect actual content size. Radix
// pairs this with a `> * { display: block }` global reset so inline
// content can't collapse into a single line; we drop the global rule
// because the project bans `globalStyle` from component code, and
// most consumers wrap their content in block-level elements anyway.

export const content = style({
  display: 'table',
  minWidth: '100%',
});

// --- Scrollbar ---

export const scrollbar = style({
  position: 'absolute',
  display: 'flex',
  // Disable browser pan/zoom gestures so a finger drag scrolls
  // instead of scrolling the page. (`user-select: none` already
  // ships from the global reset.)
  touchAction: 'none',
  backgroundColor: neutral.alpha[3],
  borderRadius: scrollbarRadius,
  transition: `opacity ${fast[2]} ${standard.productive}`,

  selectors: {
    // Per-side margin overrides per orientation. Each side falls
    // back to `space[1]` — the canonical Radix default. Consumers
    // override by setting the matching var on any ancestor (see
    // `scroll-area.vars.css.ts`).
    '&:where([data-orientation="vertical"])': {
      top: 0,
      right: 0,
      bottom: cornerHeight,
      flexDirection: 'column',
      width: scrollbarSize,
      marginTop: fallbackVar(verticalScrollbarMarginTop, space[1]),
      marginRight: fallbackVar(verticalScrollbarMarginRight, space[1]),
      marginBottom: fallbackVar(verticalScrollbarMarginBottom, space[1]),
      marginLeft: fallbackVar(verticalScrollbarMarginLeft, space[1]),
    },
    '&:where([data-orientation="horizontal"])': {
      bottom: 0,
      left: 0,
      right: cornerWidth,
      flexDirection: 'row',
      height: scrollbarSize,
      marginTop: fallbackVar(horizontalScrollbarMarginTop, space[1]),
      marginRight: fallbackVar(horizontalScrollbarMarginRight, space[1]),
      marginBottom: fallbackVar(horizontalScrollbarMarginBottom, space[1]),
      marginLeft: fallbackVar(horizontalScrollbarMarginLeft, space[1]),
    },
    '&:where([data-state="hidden"])': {
      opacity: 0,
      pointerEvents: 'none',
    },
    '&:where([data-state="visible"])': {
      opacity: 1,
    },
  },
});

// --- Thumb ---
//
// `::before` expands the hit area so a thin scrollbar still presents
// a usable click target — pseudo-element clicks attribute back to the
// host, so the larger area is interactive without an extra wrapper.

export const thumb = style({
  position: 'relative',
  backgroundColor: neutral.alpha[8],
  borderRadius: 'inherit',
  transition: `background-color ${fast[2]} ${standard.productive}`,

  selectors: {
    // Cross-axis dimension stretches to fill the track; the
    // scroll-axis dimension is set inline from the computed thumb
    // size. Without these, the flex container's `align-items:
    // stretch` default would still size the cross axis correctly,
    // but `flex-grow: 1` (a previous version) made the thumb
    // expand to fill the whole track and broke the scroll ratio.
    '&:where([data-orientation="horizontal"])': {
      height: '100%',
    },
    '&:where([data-orientation="vertical"])': {
      width: '100%',
    },
  },

  '::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    minWidth: space[4],
    minHeight: space[4],
  },

  '@media': {
    '(hover: hover)': {
      selectors: {
        '&:where(:hover)': {
          backgroundColor: neutral.alpha[9],
        },
      },
    },
  },
});

// --- Size ---
//
// Mirrors Radix's three-step scrollbar widths — 4/8/12px — and gives
// the thumb hit-area room to breathe at every step.

export const size = styleVariants({
  1: { vars: { [scrollbarSize]: space[1] } },
  2: { vars: { [scrollbarSize]: space[2] } },
  3: { vars: { [scrollbarSize]: space[3] } },
});

// --- Radius ---
//
// Each step picks a static token. Default `'full'` produces the
// canonical pill scrollbar; smaller values square the track so it
// reads as a rectangular gutter against panel edges.

export const radiusVariant = styleVariants({
  none: { vars: { [scrollbarRadius]: '0px' } },
  small: { vars: { [scrollbarRadius]: radiusToken[1] } },
  medium: { vars: { [scrollbarRadius]: radiusToken[2] } },
  large: { vars: { [scrollbarRadius]: radiusToken[3] } },
  full: { vars: { [scrollbarRadius]: radiusToken.full } },
});
