/**
 * RadioCards styles.
 *
 * Ported from Radix UI Themes RadioCards. Each item is a `<label>`
 * styled as a card surface that wraps a visually-hidden
 * `<input type="radio">` plus visible content. The card paints its
 * border on `::after` so an overlaid checked / focus outline can
 * occupy the same pseudo without clipping interior content.
 *
 * Deviations from Radix:
 * - State driven by the native `:has(input:checked)` and
 *   `:has(input:focus-visible)` predicates rather than `data-state`
 *   attributes — the input owns the truth, no JS-managed attrs.
 * - `color` accepts every semantic palette (accent / neutral / danger /
 *   warning / success). Drops the high-contrast variant (deferred).
 * - Drops the `ghost` and `soft` variants — radio cards need a clear
 *   surface boundary so users can tell what's clickable.
 * - Layout sets a sensible default of
 *   `repeat(auto-fit, minmax(160px, 1fr))`; the component exposes a
 *   numeric `columns` prop for explicit overrides.
 * - Drops Radix's `pointer-events: none` on direct children. Our
 *   `user-select: none` on the label covers text selection during
 *   click, and consumers with draggable inner content can opt out
 *   themselves.
 * - Skips upstream's `color-mix()` progressive enhancement on the
 *   surface and classic borders, per the design package's
 *   no-color-mix convention. We use the no-color-mix fallback values
 *   directly (e.g. `neutral.alpha[5]` for the surface border).
 *
 * @see https://www.radix-ui.com/themes/docs/components/radio-cards
 * @see https://www.radix-ui.com/primitives/docs/components/radio-group
 */

import { createVar, style, styleVariants } from '@vanilla-extract/css';
import {
  accent,
  background,
  danger,
  fast,
  neutral,
  radius,
  type RadiusScale,
  space,
  type SpaceScale,
  standard,
  success,
  typeScale,
  type TypeScale,
  warning,
} from '@lib/design';
import { classicShadow } from '../_internal/cards.css';

export { root, columns, gap } from '../_internal/cards.css';

const itemPaddingX = createVar();
const itemPaddingY = createVar();
const itemBorderRadius = createVar();
const colorIndicator = createVar();
const colorFocus = createVar();
// Tint painted under content when the checked card is also focused —
// matches Radix's `--focus-a3` overlay so the focused-checked state
// reads as distinct from the non-focused-checked state.
const colorFocusTint = createVar();
// Stronger outline color used on the focused-checked combination.
// Matches Radix's `--focus-10`.
const colorFocusStrong = createVar();

// --- Visually-hidden `<input type="radio">`. ---
//
// `position: absolute` + `clip-rect` keeps the input in document flow
// (so it's still focusable and form-submittable) but invisible. The
// wrapping label is the visible click target; `:has(input:...)`
// predicates on the label drive every state-dependent style. We don't
// need to zero `padding` / `margin` / `border` here — the global
// reset (`all: unset`) already handles those.

export const input = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
});

// --- Item (the styled `<label>`) ---

export const item = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space[2],
  paddingBlock: itemPaddingY,
  paddingInline: itemPaddingX,
  borderRadius: itemBorderRadius,
  // Clip overflowing content (images, long labels) to the card's
  // rounded corners so consumers don't have to wrap their content in
  // an `<Inset>` to keep things tidy. Matches upstream BaseCard.
  overflow: 'hidden',
  cursor: 'pointer',
  // Labels proxy clicks to their input — selecting label text would
  // defeat the affordance. `user-select: none` covers selection that
  // runs across the card.
  userSelect: 'none',

  selectors: {
    // `::after` is inset 1px from the item (matching upstream's
    // `inset: var(--base-card-border-width)` on BaseCard) so the
    // classic variant's first inner-shadow layer (`0 0 0 1px`) — which
    // draws *outside* `::after`'s box — lands at the item's edge
    // instead of past it. The border-radius shrinks by 1px to keep
    // the rounded corners concentric. `transition: inherit` picks up
    // the classic variant's `box-shadow` transition for the inner stack.
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: '1px',
      pointerEvents: 'none',
      borderRadius: `calc(${itemBorderRadius} - 1px)`,
      transition: 'inherit',
    },

    // Checked outline. Comes before the focus rule below so focus
    // wins on `:where()` source order when both apply. With `::after`
    // at `inset: 1px` and `outline-offset: -1px`, the outline's outer
    // edge lands at the item's edge — painting the outermost 2px of
    // the card. Matches upstream's `outline-offset: -1px` geometry.
    '&:where(:has(input:checked))::after': {
      outline: `2px solid ${colorIndicator}`,
      outlineOffset: '-1px',
    },

    // Focus ring on the wrapper when the hidden input is focus-visible.
    '&:where(:has(input:focus-visible))::after': {
      outline: `2px solid ${colorFocus}`,
      outlineOffset: '-1px',
    },

    // Focused + checked combination. Paints a translucent focus tint
    // over the surface (so the focused-checked card reads as the one
    // arrow keys are landing on) and bumps the outline to the deeper
    // focus stop. `background-image` layers on top of the variant's
    // `background-color` instead of replacing it.
    '&:where(:has(input:checked:focus-visible))': {
      backgroundImage: `linear-gradient(${colorFocusTint}, ${colorFocusTint})`,
    },
    '&:where(:has(input:checked:focus-visible))::after': {
      outlineColor: colorFocusStrong,
    },

    // Disabled. The neutral overlay on `background-image` washes out
    // the variant's surface fill so the card visibly recedes — matches
    // Radix's `--gray-a2` overlay.
    '&:where(:has(input:disabled))': {
      cursor: 'not-allowed',
      color: neutral.alpha[9],
      backgroundImage: `linear-gradient(${neutral.alpha[2]}, ${neutral.alpha[2]})`,
    },
    // Mute the selection highlight on disabled cards. `::selection`
    // on the label propagates to its subtree by spec, so a consumer
    // that opts inner content back into selection picks up the
    // muted color.
    '&:where(:has(input:disabled))::selection': {
      backgroundColor: neutral.alpha[5],
    },
    '&:where(:has(input:disabled))::after': {
      outlineColor: neutral.solid[8],
    },
  },
});

// --- Size ---
//
// Padding-y uses the same non-integer multipliers as upstream so the
// card heights land on the documented 40 / 48 / 64 px targets at the
// default scale. Each size also assigns the matching typography step
// — without this the global `all: unset` reset on `<label>` strips
// font-size + line-height inheritance, leaving every card at the
// browser's medium default.

interface SizeStyle {
  /** Padding token used on the inline (X) axis. */
  padX: SpaceScale;
  /**
   * Padding-y multiplier expression interpolated into a `calc()`. We
   * keep this as a string so it tracks upstream's exact math
   * (`space-3 / 1.2`, `space-4 * 0.875`, `space-5 / 1.2`).
   */
  padY: string;
  /** Border-radius token. */
  rad: RadiusScale;
  /** Type scale step the card's text should render at. */
  font: TypeScale;
}

const sizeStyle = ({ padX, padY, rad, font }: SizeStyle) => ({
  fontSize: typeScale[font].fontSize,
  lineHeight: typeScale[font].lineHeight,
  letterSpacing: typeScale[font].letterSpacing,
  vars: {
    [itemPaddingX]: space[padX],
    [itemPaddingY]: padY,
    [itemBorderRadius]: radius[rad],
  },
});

export const size = styleVariants({
  1: sizeStyle({ padX: 3, padY: `calc(${space[3]} / 1.2)`, rad: 3, font: 2 }),
  2: sizeStyle({ padX: 4, padY: `calc(${space[4]} * 0.875)`, rad: 3, font: 2 }),
  3: sizeStyle({ padX: 5, padY: `calc(${space[5]} / 1.2)`, rad: 4, font: 3 }),
});

// --- Variant ---
//
// `surface` paints a flat 1px border (rest) that thickens slightly on
// hover. `classic` animates the layered shadow stack from
// `_internal/cards.css.ts` so the card lifts smoothly. The hover
// selector excludes both disabled and checked items — the checked
// card's outline already provides a strong cue, so a hover lift on
// top of it would compete.

// Border alphas match upstream's no-color-mix fallback (`gray-a5` rest,
// `gray-a7` hover) — see `_internal/base-card.css` lines 67-70. With
// `color-mix()` upstream nudges these one alpha step heavier; we don't
// take the progressive enhancement so the values stay at 5 / 7.
//
// Non-inset (`spread` only). `::after` sits at `inset: 1px`, so the
// shadow's 1px layer extends outward from `::after`'s edge and lands
// at the item's edge — the visible 1px border. Inset shadows would
// draw the line 1px *inside* `::after` instead, leaving a visible
// gap between the painted line and the item's rounded corner.
const surfaceBorderShadow = `0 0 0 1px ${neutral.alpha[5]}`;
const surfaceBorderHoverShadow = `0 0 0 1px ${neutral.alpha[7]}`;
const idleStateSelector =
  '&:where(:not(:has(input:disabled)):not(:has(input:checked)):hover)';

export const variant = styleVariants({
  surface: {
    backgroundColor: background.surface,
    selectors: {
      '&::after': { boxShadow: surfaceBorderShadow },
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          [`${idleStateSelector}::after`]: {
            boxShadow: surfaceBorderHoverShadow,
          },
        },
      },
    },
  },
  // Classic is the only variant that animates state changes — matches
  // upstream. The transition shorthand is interpolated as a string so
  // the `::after` rule's `transition: inherit` picks up the same
  // property + duration + timing-function in one go.
  //
  // Background stays at `--color-surface` (matches upstream classic),
  // not `panelSolid` — the classic look comes from the shadow stack,
  // not a heavier surface fill.
  classic: {
    backgroundColor: background.surface,
    boxShadow: classicShadow.rest.outer,
    transition: `box-shadow ${fast[2]} ${standard.productive}`,
    selectors: {
      '&::after': { boxShadow: classicShadow.rest.inner },
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          [idleStateSelector]: {
            transitionDuration: fast[1],
            boxShadow: classicShadow.hover.outer,
          },
          [`${idleStateSelector}::after`]: {
            boxShadow: classicShadow.hover.inner,
          },
        },
      },
    },
  },
});

// --- Color (drives the checked indicator + focus outline) ---

export const color = styleVariants({
  accent: {
    vars: {
      [colorIndicator]: accent.indicator,
      [colorFocus]: accent.solid[8],
      [colorFocusTint]: accent.alpha[3],
      [colorFocusStrong]: accent.solid[10],
    },
  },
  neutral: {
    vars: {
      [colorIndicator]: neutral.indicator,
      // Neutral cards fall back to accent for the focus outline so the
      // cue stays distinct against gray ink — same exception
      // `RadioGroup` codifies for its neutral palette.
      [colorFocus]: accent.solid[8],
      [colorFocusTint]: accent.alpha[3],
      [colorFocusStrong]: accent.solid[10],
    },
  },
  danger: {
    vars: {
      [colorIndicator]: danger.indicator,
      [colorFocus]: danger.solid[8],
      [colorFocusTint]: danger.alpha[3],
      [colorFocusStrong]: danger.solid[10],
    },
  },
  warning: {
    vars: {
      [colorIndicator]: warning.indicator,
      [colorFocus]: warning.solid[8],
      [colorFocusTint]: warning.alpha[3],
      [colorFocusStrong]: warning.solid[10],
    },
  },
  success: {
    vars: {
      [colorIndicator]: success.indicator,
      [colorFocus]: success.solid[8],
      [colorFocusTint]: success.alpha[3],
      [colorFocusStrong]: success.solid[10],
    },
  },
});
