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
  shadow,
  space,
  type SpaceScale,
  standard,
  success,
  warning,
} from '@lib/design';

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

// --- Root (the radiogroup container, styled as a CSS Grid) ---

export const root = style({
  display: 'grid',
  // Auto-fit gives a useful mobile-first default — items collapse to a
  // single column on narrow screens and stretch to fill on wider ones.
  // The numeric `columns` variant below overrides this when set.
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
});

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
  cursor: 'pointer',
  // Labels proxy clicks to their input — selecting label text would
  // defeat the affordance. `user-select: none` covers selection that
  // runs across the card.
  userSelect: 'none',
  transitionProperty: 'background-color, box-shadow',
  transitionTimingFunction: standard.productive,

  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      borderRadius: itemBorderRadius,
      transitionProperty: 'box-shadow, outline-color',
      transitionTimingFunction: standard.productive,
    },

    // Checked outline. Comes before the focus rule below so focus
    // wins on `:where()` source order when both apply.
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
    '&:where(:has(input:disabled))::after': {
      outlineColor: neutral.solid[8],
    },
  },

  '@media': {
    '(hover: hover)': {
      transitionDuration: fast[2],
      selectors: {
        '&::after': { transitionDuration: fast[2] },
      },
    },
  },
});

// --- Size ---

const sizeStyle = (padX: SpaceScale, padY: SpaceScale, rad: RadiusScale) => ({
  vars: {
    [itemPaddingX]: space[padX],
    [itemPaddingY]: space[padY],
    [itemBorderRadius]: radius[rad],
  },
});

export const size = styleVariants({
  1: sizeStyle(3, 2, 3),
  2: sizeStyle(4, 3, 3),
  3: sizeStyle(5, 4, 4),
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
const idleStateSelector =
  '&:where(:not(:has(input:disabled)):not(:has(input:checked)):hover)';

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
  classic: {
    backgroundColor: background.panelSolid,
    boxShadow: shadow[3],
    selectors: {
      '&::after': { boxShadow: borderShadow },
    },
    '@media': {
      '(hover: hover)': {
        selectors: {
          [idleStateSelector]: { boxShadow: shadow[4] },
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
