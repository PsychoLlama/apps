/**
 * Dialog styles.
 *
 * Ported from Radix UI Themes Dialog, rebuilt on a native `<dialog>`
 * promoted to the top layer by `showModal()`. Upstream's four-element
 * stack (portal → overlay → scroll → scroll-padding → content) collapses
 * to three: the `<dialog>` *is* the overlay, and the scroll/padding pair
 * survives because centering a possibly-taller-than-viewport panel still
 * needs both an `overflow: auto` box and an `auto`-margin box inside it.
 *
 * Deviations from Radix:
 * - No portal and no `z-index`. `showModal()` renders into the top
 *   layer, which already paints above every stacking context in the
 *   document and ignores ancestor `overflow` / `transform` / `filter`
 *   containing blocks — the exact problems the portal existed to dodge.
 *   The element stays where the consumer wrote it, so it keeps
 *   inheriting typography and color from its real ancestors.
 * - The dim is the `<dialog>`'s own `background-color`, not `::backdrop`.
 *   The element fills the viewport, so the two paint identically, and
 *   `::backdrop` historically did not inherit custom properties from its
 *   originating element — every `@lib/design` token is a custom
 *   property, so it would resolve to guaranteed-invalid. The UA's
 *   default backdrop tint is cleared instead.
 * - One opacity animation on the `<dialog>` fades the dim *and* the
 *   panel together, so the panel's own keyframes carry only the
 *   transform. Upstream needs two fades (plus a no-op animation to hold
 *   the overlay mounted) because its overlay and content are separate
 *   presence-tracked nodes with different durations; here a single
 *   element owns both, and one shared exit duration means presence has
 *   exactly one animation to wait on.
 * - Motion rides the scale: `moderate[1]` in (upstream 200ms),
 *   `fast[2]` out (upstream 160ms/100ms), with `entrance.productive` /
 *   `exit.productive` in place of upstream's bespoke
 *   `cubic-bezier(0.16, 1, 0.3, 1)`. Durations collapse under
 *   `prefers-reduced-motion`.
 * - Replaces upstream's responsive `size` / `align` object props with
 *   plain enums (Vanilla Extract pre-compiles each variant; the
 *   responsive object form would defeat that and bloat the bundle).
 * - Drops the `width` / `minWidth` / `height` escape hatches. `maxWidth`
 *   is the one that earns its keep; the rest are a `class` away.
 * - Adds the safe-area insets to the panel's gutters. Upstream measures
 *   them from the screen edge, which on a `viewport-fit=cover` page puts
 *   the panel under the notch and the home indicator.
 * - Skips `highContrast` (deferred deviation).
 *
 * @see https://www.radix-ui.com/themes/docs/components/dialog
 */

import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import {
  background,
  entrance,
  exit,
  fast,
  moderate,
  radius,
  shadow,
  space,
  type RadiusScale,
  type SpaceScale,
} from '@lib/design';
import {
  cardBorderRadius,
  cardPaddingBottom,
  cardPaddingLeft,
  cardPaddingRight,
  cardPaddingTop,
} from '../card/card.vars.css';

/**
 * How far the panel rises into place. Motion geometry rather than
 * layout spacing — it never contributes to the resting box — so it
 * stays a literal instead of borrowing from the space scale.
 */
const LIFT = '5px';

// --- Overlay (the `<dialog>` itself) ---
//
// The reset hands modal dialogs back their UA styles (`:where(dialog:modal)
// { all: revert }`) so native behavior is intact; everything the UA sets
// for a *centered auto-sized box* has to be unwound here, because this
// dialog is a full-viewport scroll surface instead.
//
// `display` is deliberately absent. The UA's `dialog:not([open]) {
// display: none }` is what hides a closed dialog, and any author-origin
// `display` would beat it and leave a closed dialog painted over the page.

export const overlay = style({
  position: 'fixed',
  inset: 0,
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  maxHeight: 'none',
  // eslint-disable-next-line custom/require-design-tokens -- the reset hands modal dialogs back their UA box (`:where(dialog:modal) { all: revert }`), so these undo `margin: auto` / `padding: 1em`, not a reset default.
  margin: 0,
  // eslint-disable-next-line custom/require-design-tokens -- see above; unwinds the UA's `padding: 1em`.
  padding: 0,
  border: 'none',
  overflow: 'hidden',
  // The UA paints modal dialogs on `canvas`/`canvastext`; the panel owns
  // its own surface, and text inherits from where the consumer wrote the
  // element rather than from the UA.
  color: 'inherit',
  backgroundColor: background.overlay,

  // The top layer already isolates this element, so the browser's own
  // backdrop tint would only double the dim.
  '::backdrop': {
    backgroundColor: 'transparent',
  },

  selectors: {
    '&:where([data-state="open"])': {
      animation: `${keyframes({
        from: { opacity: 0 },
        to: { opacity: 1 },
      })} ${moderate[1]} ${entrance.productive}`,
    },
    // Presence holds `[open]` — and with it the top-layer slot — until
    // this animation settles, then calls `close()`.
    '&:where([data-state="closed"])': {
      opacity: 0,
      animation: `${keyframes({
        from: { opacity: 1 },
        to: { opacity: 0 },
      })} ${fast[2]} ${exit.productive}`,
    },
  },
});

// --- Scroll surface ---
//
// Absolutely positioned rather than sized, so it fills the overlay
// without inheriting its `overflow: hidden`. `overscroll-behavior`
// keeps a flick past the end of a long dialog from chaining out to the
// page underneath.

export const scroll = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  overflow: 'auto',
  overscrollBehavior: 'contain',
});

/**
 * The centering box. `flex-grow` claims the full scroll width and
 * `margin: auto` centers the panel in whatever space is left over —
 * which, unlike `justify-content`, still lets an overflowing panel
 * scroll to its own top edge instead of being clipped.
 *
 * The space it centers within is the layout viewport, so the host page
 * has to declare `interactive-widget=resizes-content` for an on-screen
 * keyboard to count against it. Otherwise the keyboard shrinks only the
 * visual viewport and a centered panel can sit behind it.
 */
export const scrollPadding = style({
  flexGrow: 1,
  margin: 'auto',
  // The page is `viewport-fit=cover` and the dialog is `inset: 0`, so
  // these gutters start at the screen edge — under the notch and the
  // home indicator. Adding the safe-area insets measures the panel's
  // breathing room from the safe area inward instead, matching how
  // `@lib/shell` pads its header. Upstream doesn't handle this at all.
  paddingBlockStart: `calc(${space[6]} + env(safe-area-inset-top))`,
  // Leaves the panel visibly off the bottom edge on tall viewports
  // without eating the screen on short ones.
  paddingBlockEnd: `calc(max(${space[6]}, 6vh) + env(safe-area-inset-bottom))`,
  paddingInlineStart: `calc(${space[4]} + env(safe-area-inset-left))`,
  paddingInlineEnd: `calc(${space[4]} + env(safe-area-inset-right))`,
});

export const align = styleVariants({
  center: { marginBlockStart: 'auto' },
  // eslint-disable-next-line custom/require-design-tokens -- cancels the `margin: auto` above so the panel pins to the top of the scroll surface; not a redundant reset.
  start: { marginBlockStart: 0 },
});

// --- Panel ---

export const panel = style({
  position: 'relative',
  margin: 'auto',
  width: '100%',
  // Overridden inline by the `maxWidth` prop.
  maxWidth: '600px',
  overflow: 'auto',
  backgroundColor: background.panelSolid,
  boxShadow: shadow[6],
  // `showModal()` may land focus here when nothing inside is focusable;
  // the dialog's own chrome is the focus indicator.
  outline: 'none',

  selectors: {
    [`${overlay}:where([data-state="open"]) &`]: {
      animation: `${keyframes({
        from: { transform: `translateY(${LIFT}) scale(0.97)` },
        to: { transform: 'none' },
      })} ${moderate[1]} ${entrance.productive}`,
    },
    [`${overlay}:where([data-state="closed"]) &`]: {
      animation: `${keyframes({
        from: { transform: 'none' },
        to: { transform: `translateY(${LIFT}) scale(0.99)` },
      })} ${fast[2]} ${exit.productive}`,
    },
  },
});

// --- Header ---
//
// Both margins are conditional on something following, so a dialog with
// no body doesn't trail dead space inside its own padding. `:last-child`
// counts elements only — a body passed as bare text won't clear the
// margin, which is why `@lib/ui` asks consumers for semantic elements.

/** Title spacing. Matches upstream's `mb="3"` on `Dialog.Title`. */
export const title = style({
  selectors: {
    '&:where(:not(:last-child))': { marginBlockEnd: space[3] },
  },
});

/**
 * Description spacing. Upstream leaves this to the call site (its docs
 * examples all reach for `mb="4"`); our API renders the description, so
 * it owns the gap.
 */
export const description = style({
  selectors: {
    '&:where(:not(:last-child))': { marginBlockEnd: space[4] },
  },
});

// --- Size ---
//
// Padding and rounding match upstream one-for-one. The Card vars ride
// along so `<Inset>` can bleed to the panel's edges here exactly as it
// does inside a Card.

const sizeStyle = (pad: SpaceScale, rounding: RadiusScale) => ({
  padding: space[pad],
  borderRadius: radius[rounding],
  vars: {
    [cardPaddingTop]: space[pad],
    [cardPaddingRight]: space[pad],
    [cardPaddingBottom]: space[pad],
    [cardPaddingLeft]: space[pad],
    [cardBorderRadius]: radius[rounding],
  },
});

export const size = styleVariants({
  1: sizeStyle(3, 4),
  2: sizeStyle(4, 4),
  3: sizeStyle(5, 5),
  4: sizeStyle(6, 5),
});
