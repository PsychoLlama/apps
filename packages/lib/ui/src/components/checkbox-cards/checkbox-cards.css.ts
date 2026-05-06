/**
 * CheckboxCards styles.
 *
 * Ported from Radix UI Themes CheckboxCards. Each item is a `<label>`
 * styled as a card surface. Unlike RadioCards (which hides its input
 * and uses a checked outline as the only state cue), CheckboxCards
 * renders a visible `<Checkbox>` pinned to the right of the card —
 * matching the upstream design intent. The card itself paints a hover
 * border on `::after`; the checked indicator is the visible checkbox.
 *
 * Deviations from Radix:
 * - State driven by the native `:has(input:disabled)` /
 *   `:has(input:focus-visible)` predicates rather than `data-state`
 *   attributes — the input owns the truth, no JS-managed attrs.
 * - `color` accepts every semantic palette (accent / neutral / danger /
 *   warning / success). Drops the high-contrast variant (deferred).
 * - The focus-ring color tracks the active palette via `colorFocus`
 *   (same approach as `RadioCards` and `Checkbox`), where upstream
 *   uses a dedicated `--focus-8` palette that stays constant across
 *   colors. Intentional — keeps the cue cohesive with the card's
 *   `color` prop.
 * - Drops Radix's `pointer-events: none` on direct children. Our
 *   `user-select: none` on the label covers text selection during
 *   click; consumers with draggable inner content can opt out
 *   themselves.
 * - Skips upstream's `color-mix()` progressive enhancement on the
 *   surface and classic borders, per the design package's
 *   no-color-mix convention. We use the no-color-mix fallback values
 *   directly (e.g. `neutral.alpha[5]` for the surface border).
 * - Forces the inner Checkbox to the surface variant (matching upstream
 *   — the card already provides the surface, so a soft fill on the
 *   indicator would clash with the card).
 *
 * @see https://www.radix-ui.com/themes/docs/components/checkbox-cards
 * @see https://www.radix-ui.com/primitives/docs/components/checkbox
 */

import {
  assignVars,
  createThemeContract,
  createVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import {
  accent,
  background,
  black,
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
import { assignColorSchemeVars } from '@lib/design/color-scheme';

const itemPaddingX = createVar();
const itemPaddingY = createVar();
const itemPaddingRight = createVar();
const itemBorderRadius = createVar();
const colorFocus = createVar();

// --- Classic variant shadow stack ---
//
// Upstream's classic card uses a 6-layer box-shadow split between the
// item (outer) and `::after` (inner) so the elevation animates between
// rest and hover via `transition: box-shadow`. CSS interpolates layered
// shadows index-by-index, so every state needs the same layer count —
// hence the zeroed-out layers in the rest stack that "grow" on hover.
// Light and dark differ structurally (light is a downward drop shadow;
// dark is a near-radial glow), so a single `light-dark()` won't cover
// it — we register a theme contract and assign per-mode values via
// `assignColorSchemeVars`. This is exactly the per-component shadow
// eject the design package's `shadow.css.ts` documents (case 2:
// animation-matched layers).
//
// Border colors fall back to upstream's no-color-mix branch (per the
// project convention against `color-mix()` progressive enhancement).
// That means hover doesn't actually shift the border color in light
// mode; the elevation lift carries the hover cue on its own.
//
// Layer math copied verbatim from
// `_internal/base-card.css` (lines 93-205) — keep in sync if Radix
// retunes upstream.

const classicShadow = createThemeContract({
  rest: { outer: '', inner: '' },
  hover: { outer: '', inner: '' },
});

const classicShadowsLight = {
  rest: {
    outer: [
      `0 0 0 0 ${neutral.alpha[3]}`,
      `0 0 0 0 transparent`,
      `0 0 0 0 ${black[1]}`,
      `0 1px 1px -1px ${neutral.alpha[2]}`,
      `0 2px 1px -2px ${black[1]}`,
      `0 1px 3px -1px ${black[1]}`,
    ].join(', '),
    inner: [
      `0 0 0 1px ${neutral.alpha[3]}`,
      `0 0 0 1px transparent`,
      `0 0 0 0.5px ${black[1]}`,
      `0 1px 1px 0 ${neutral.alpha[2]}`,
      `0 2px 1px -1px ${black[1]}`,
      `0 1px 3px 0 ${black[1]}`,
    ].join(', '),
  },
  hover: {
    outer: [
      `0 0 0 0 ${neutral.alpha[3]}`,
      `0 1px 1px 0 ${black[1]}`,
      `0 2px 1px -2px ${neutral.alpha[3]}`,
      `0 2px 3px -3px ${black[1]}`,
      `0 3px 12px -5px ${neutral.alpha[3]}`,
      `0 4px 16px -9px ${black[1]}`,
    ].join(', '),
    inner: [
      `0 0 0 1px ${neutral.alpha[3]}`,
      `0 1px 1px 1px ${black[1]}`,
      `0 2px 1px -1px ${neutral.alpha[3]}`,
      `0 2px 3px -2px ${black[1]}`,
      `0 3px 12px -4px ${neutral.alpha[3]}`,
      `0 4px 16px -8px ${black[1]}`,
    ].join(', '),
  },
};

const classicShadowsDark = {
  rest: {
    outer: [
      `0 0 0 0 ${neutral.alpha[6]}`,
      `0 0 0 0 transparent`,
      `0 0 0 0 ${black[3]}`,
      `0 1px 1px -1px ${black[6]}`,
      `0 2px 1px -2px ${black[6]}`,
      `0 1px 3px -1px ${black[5]}`,
    ].join(', '),
    inner: [
      `0 0 0 1px ${neutral.alpha[6]}`,
      `0 0 0 1px transparent`,
      `0 0 0 0.5px ${black[3]}`,
      `0 1px 1px 0 ${black[6]}`,
      `0 2px 1px -1px ${black[6]}`,
      `0 1px 3px 0 ${black[5]}`,
    ].join(', '),
  },
  hover: {
    outer: [
      `0 0 0 0 ${neutral.alpha[6]}`,
      `0 0 1px 0 ${neutral.alpha[4]}`,
      `0 0 1px -2px ${neutral.alpha[4]}`,
      `0 0 3px -3px ${neutral.alpha[3]}`,
      `0 0 12px -3px ${neutral.alpha[3]}`,
      `0 0 16px -9px ${neutral.alpha[7]}`,
    ].join(', '),
    inner: [
      `0 0 0 1px ${neutral.alpha[6]}`,
      `0 0 1px 1px ${neutral.alpha[4]}`,
      `0 0 1px -1px ${neutral.alpha[4]}`,
      `0 0 3px -2px ${neutral.alpha[3]}`,
      `0 0 12px -2px ${neutral.alpha[3]}`,
      `0 0 16px -8px ${neutral.alpha[7]}`,
    ].join(', '),
  },
};

assignColorSchemeVars(
  assignVars(classicShadow, classicShadowsLight),
  assignVars(classicShadow, classicShadowsDark),
);

// --- Root (the group container, styled as a CSS Grid) ---

export const root = style({
  display: 'grid',
  // Auto-fit gives a useful mobile-first default — items collapse to a
  // single column on narrow screens and stretch to fill on wider ones.
  // The numeric `columns` variant below overrides this when set.
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  // The group itself isn't interactive — only the cards inside
  // are. Forces the default arrow cursor over grid gaps so users
  // don't see a misleading pointer hint.
  cursor: 'default',
});

// --- Item (the styled `<label>`) ---

export const item = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: space[2],
  paddingBlock: itemPaddingY,
  paddingLeft: itemPaddingX,
  // Padding-right reserves space for the absolutely-positioned
  // checkbox so card content doesn't slide under it.
  paddingRight: itemPaddingRight,
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
    // instead of past it. With `::after` flush at `inset: 0`, that
    // layer extended beyond the item and got clipped by
    // `overflow: hidden`, leaving the classic edge invisible. The
    // border-radius shrinks by 1px to keep the rounded corners
    // concentric with the item's. `transition: inherit` picks up the
    // classic variant's `box-shadow` transition for the inner stack.
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: '1px',
      pointerEvents: 'none',
      borderRadius: `calc(${itemBorderRadius} - 1px)`,
      transition: 'inherit',
    },

    // Focus ring. Two stacked outlines — one on the item at offset
    // -1px and one on `::after` at the default offset 0. Item's edge
    // is at the outer boundary, ::after's edge is 1px inside; both
    // outlines extend outward from those edges and combine into a
    // single visible band hugging the item edge. Mirrors upstream's
    // pattern of declaring the outline on the item and re-declaring
    // (via `outline: inherit`) on `::after`.
    '&:where(:has(input:focus-visible))': {
      outline: `2px solid ${colorFocus}`,
      outlineOffset: '-1px',
    },
    '&:where(:has(input:focus-visible))::after': {
      outline: `2px solid ${colorFocus}`,
    },

    // Disabled. The neutral overlay on `background-image` washes out
    // the variant's surface fill so the card visibly recedes — matches
    // Radix's `--gray-a2` overlay.
    '&:where(:has(input:disabled))': {
      cursor: 'not-allowed',
      color: neutral.alpha[9],
      backgroundImage: `linear-gradient(${neutral.alpha[2]}, ${neutral.alpha[2]})`,
    },
    '&:where(:has(input:disabled))::selection': {
      backgroundColor: neutral.alpha[5],
    },
  },
});

// The visible checkbox pinned to the right edge of the card.
// `position: absolute` lifts it out of the flex layout so card content
// can grow independently; its right offset matches `itemPaddingX` so
// the gutter between checkbox and card edge equals the gutter between
// content and checkbox, keeping the layout symmetric.
//
// Suppresses the inner Checkbox's `:focus-visible::before` outline
// (defined in `checkbox.css.ts`). The card's `:has(input:focus-visible)`
// rule above paints the focus cue at the wrapper level — showing both
// produces a doubled ring, where upstream's BaseCheckbox has no
// focus rule of its own inside CheckboxCards. CheckboxCards' CSS
// loads after the Checkbox's so this same-specificity `:where`
// selector wins by source order.
export const checkbox = style({
  position: 'absolute',
  right: itemPaddingX,
  selectors: {
    '&:where(:focus-visible)::before': {
      outline: 'none',
    },
  },
});

// --- Size ---
//
// Padding-y uses the same non-integer multipliers as upstream so the
// card heights land on the documented 40 / 48 / 64 px targets at the
// default scale. The right-side padding follows upstream's formula —
// `itemPaddingX * 2 + checkboxSize` — so the absolute checkbox sits
// with equal gutters on either side. Each size also assigns the
// matching typography step (the global `all: unset` reset on `<label>`
// strips inherited font metrics, so we re-apply them here).

interface SizeStyle {
  /** Padding token used on the inline (X) axis. */
  padX: SpaceScale;
  /**
   * Padding-y multiplier expression interpolated into a `calc()`. We
   * keep this as a string so it tracks upstream's exact math
   * (`space-3 / 1.2`, `space-4 * 0.875`, `space-5 / 1.2`).
   */
  padY: string;
  /**
   * Visible checkbox size for this card size. Matches the `Checkbox`
   * size variant we forward in the TSX — so right-side padding
   * reserves the right amount of space.
   */
  checkboxSize: string;
  /** Border-radius token. */
  rad: RadiusScale;
  /** Type scale step the card's text should render at. */
  font: TypeScale;
}

const sizeStyle = ({ padX, padY, checkboxSize, rad, font }: SizeStyle) => ({
  fontSize: typeScale[font].fontSize,
  lineHeight: typeScale[font].lineHeight,
  letterSpacing: typeScale[font].letterSpacing,
  vars: {
    [itemPaddingX]: space[padX],
    [itemPaddingY]: padY,
    [itemPaddingRight]: `calc(${space[padX]} * 2 + ${checkboxSize})`,
    [itemBorderRadius]: radius[rad],
  },
});

export const size = styleVariants({
  1: sizeStyle({
    padX: 3,
    padY: `calc(${space[3]} / 1.2)`,
    checkboxSize: `calc(${space[4]} * 0.875)`,
    rad: 3,
    font: 2,
  }),
  2: sizeStyle({
    padX: 4,
    padY: `calc(${space[4]} * 0.875)`,
    checkboxSize: space[4],
    rad: 3,
    font: 2,
  }),
  3: sizeStyle({
    padX: 5,
    padY: `calc(${space[5]} / 1.2)`,
    checkboxSize: `calc(${space[4]} * 1.25)`,
    rad: 4,
    font: 3,
  }),
});

// --- Numeric column override ---
//
// Default grid is `auto-fit minmax`; the `columns` prop swaps in a
// fixed column count for layouts that need exact alignment.

const repeat = (count: number) => `repeat(${count}, minmax(0, 1fr))`;
export const columns = styleVariants({
  1: { gridTemplateColumns: repeat(1) },
  2: { gridTemplateColumns: repeat(2) },
  3: { gridTemplateColumns: repeat(3) },
  4: { gridTemplateColumns: repeat(4) },
  5: { gridTemplateColumns: repeat(5) },
  6: { gridTemplateColumns: repeat(6) },
});

// --- Gap ---

export const gap = styleVariants(space, (value) => ({ gap: value }));

// --- Variant ---
//
// `surface` paints a flat 1px outline (rest) that thickens slightly on
// hover. `classic` animates the layered shadow stack defined above so
// the card lifts smoothly. The hover selector excludes disabled items
// only — there's no checked-state exclusion (unlike RadioCards) since
// the visible inner Checkbox carries the checked cue, not a card-level
// outline.

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
const idleStateSelector = '&:where(:not(:has(input:disabled)):hover)';

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

// --- Color (drives the focus ring on the card wrapper) ---
//
// The visible checkbox owns its own indicator color via the inner
// `<Checkbox>` component — these vars only feed the card's focus
// outline so the cue tracks the active palette.

export const color = styleVariants({
  accent: { vars: { [colorFocus]: accent.solid[8] } },
  // Neutral cards fall back to accent for the focus outline so the
  // cue stays distinct against gray ink — same exception RadioCards
  // and Checkbox codify for their neutral palette.
  neutral: { vars: { [colorFocus]: accent.solid[8] } },
  danger: { vars: { [colorFocus]: danger.solid[8] } },
  warning: { vars: { [colorFocus]: warning.solid[8] } },
  success: { vars: { [colorFocus]: success.solid[8] } },
});
