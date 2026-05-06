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
 * - Drops Radix's `pointer-events: none` on direct children. Our
 *   `user-select: none` on the label covers text selection during
 *   click; consumers with draggable inner content can opt out
 *   themselves.
 * - Forces the inner Checkbox to the surface variant (matching upstream
 *   — the card already provides the surface, so a soft fill on the
 *   indicator would clash with the card).
 *
 * @see https://www.radix-ui.com/themes/docs/components/checkbox-cards
 * @see https://www.radix-ui.com/primitives/docs/components/checkbox
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
  shadow,
  space,
  type SpaceScale,
  standard,
  success,
  typeScale,
  type TypeScale,
  warning,
} from '@lib/design';

const itemPaddingX = createVar();
const itemPaddingY = createVar();
const itemPaddingRight = createVar();
const itemBorderRadius = createVar();
const colorFocus = createVar();

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
    // The `::after` border inherits whatever transition the variant
    // defines. Upstream's BaseCard does the same — only the classic
    // variant transitions box-shadow; surface state changes snap.
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      borderRadius: itemBorderRadius,
      transition: 'inherit',
    },

    // Focus ring on the wrapper when the inner checkbox is
    // focus-visible. The visible checkbox has its own focus ring; this
    // amplifies the cue so the entire card reads as the focus target.
    '&:where(:has(input:focus-visible))::after': {
      outline: `2px solid ${colorFocus}`,
      outlineOffset: '-1px',
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
export const checkbox = style({
  position: 'absolute',
  right: itemPaddingX,
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

const borderShadow = `inset 0 0 0 1px ${neutral.alpha[6]}`;
const borderHoverShadow = `inset 0 0 0 1px ${neutral.alpha[8]}`;
const idleStateSelector = '&:where(:not(:has(input:disabled)):hover)';

export const variant = styleVariants({
  surface: {
    backgroundColor: background.surface,
    selectors: {
      '&::after': { boxShadow: borderShadow },
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          [`${idleStateSelector}::after`]: { boxShadow: borderHoverShadow },
        },
      },
    },
  },
  // Classic is the only variant that animates state changes — matches
  // upstream. The transition shorthand is interpolated as a string so
  // the `::after` rule's `transition: inherit` picks up the same
  // property + duration + timing-function in one go.
  classic: {
    backgroundColor: background.panelSolid,
    boxShadow: shadow[3],
    transition: `box-shadow ${fast[2]} ${standard.productive}`,
    selectors: {
      '&::after': { boxShadow: borderShadow },
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          [idleStateSelector]: {
            transitionDuration: fast[1],
            boxShadow: shadow[4],
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
