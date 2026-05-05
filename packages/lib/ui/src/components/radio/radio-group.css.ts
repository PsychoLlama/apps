/**
 * Radio + RadioGroup styles.
 *
 * Ported from Radix UI Themes BaseRadio. The native `<input type="radio">`
 * is the styling host: `appearance: none` strips the user-agent control,
 * `::before` paints the ring background, and `::after` paints the inner
 * dot when `:checked`. The `item`/`itemInner` rules at the bottom govern
 * the optional inline label that `RadioGroupItem` renders when `children`
 * are provided.
 *
 * Deviations from Radix:
 * - State driven by the native `:checked` and `:disabled` pseudo-classes
 *   rather than `data-state` data-attrs — same behavior, no JS-managed
 *   attributes, predicates stay tied to the input's intrinsic state.
 * - `color` accepts every semantic palette (accent / neutral / danger /
 *   warning / success). Radix exposes a hand-picked subset.
 * - Drops the high-contrast variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/radio-group
 */

import {
  createVar,
  fallbackVar,
  style,
  styleVariants,
} from '@vanilla-extract/css';
import {
  accent,
  background,
  black,
  danger,
  neutral,
  radius,
  shadow,
  space,
  success,
  warning,
  white,
} from '@lib/design';
import { lineHeight } from '../../vars/typography.css';

// Vars set by the `size` and `color` variants and read by every other
// rule below — assigning a single variant reaches the entire element.
const radioSize = createVar();
const colorIndicator = createVar();
const colorContrast = createVar();
const colorAlpha4 = createVar();
const colorAlpha11 = createVar();
const colorFocus = createVar();

// --- Root (the styled `<input type="radio">`) ---

export const root = style({
  appearance: 'none',
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  verticalAlign: 'top',
  width: radioSize,
  // Track the surrounding text's line-height when present so the radio
  // sits flush against the first line of a wrapping label rather than
  // drifting to the geometric center of the wrapped block. The
  // `lineHeight` var is set by the wrapping `<Text as="label">` (size
  // variants in `text.css`) and inherits to this descendant via the
  // CSS custom-property cascade. Standalone radios fall back to
  // `radioSize`. The disc/dot below stay sized to `radioSize` so only
  // the click box stretches; the visible circle keeps its diameter.
  //
  // The outer `max(..., radioSize)` guards against a smaller-text
  // ancestor shrinking the root below the visible disc — Radix has
  // the same opportunity but doesn't take it.
  height: `max(${fallbackVar(lineHeight, radioSize)}, ${radioSize})`,
  cursor: 'pointer',

  // Ring. `::before` is the visible disc; the input itself is a flex
  // container that holds the dot via `::after`. `radius.full` (9999px)
  // exceeds half the radio's diameter at every size, which collapses
  // to a perfect circle.
  '::before': {
    content: '""',
    display: 'block',
    width: radioSize,
    height: radioSize,
    borderRadius: radius.full,
  },

  // Dot. Scaled via `transform: scale(0.4)` rather than an explicit
  // size to match Radix's sub-pixel positioning trick — the inner dot
  // tracks the ring's center cleanly across every size.
  '::after': {
    pointerEvents: 'none',
    position: 'absolute',
    width: radioSize,
    height: radioSize,
    borderRadius: radius.full,
    transform: 'scale(0.4)',
  },

  selectors: {
    '&:where(:checked)::after': {
      content: '""',
    },
    '&:where(:focus-visible)::before': {
      outline: `2px solid ${colorFocus}`,
      outlineOffset: '2px',
    },
    '&:where(:disabled)': {
      cursor: 'not-allowed',
    },
  },
});

// --- Size ---

// Radix's sizes: 1 = 0.875 × space[4], 2 = space[4], 3 = 1.25 × space[4].
// We ride `space[4]` directly so the radio scales with the spacing token.
export const size = styleVariants({
  1: { vars: { [radioSize]: `calc(${space[4]} * 0.875)` } },
  2: { vars: { [radioSize]: space[4] } },
  3: { vars: { [radioSize]: `calc(${space[4]} * 1.25)` } },
});

// --- Color ---
//
// Each color binds the four palette refs the rest of the stylesheet
// reads: `indicator` paints the ring fill on checked surface/classic;
// `contrast` paints the dot on those variants; `alpha[4]` paints the
// soft ring; `alpha[11]` paints the soft dot; `solid[8]` drives the
// focus outline so it tracks the active color.

export const color = styleVariants({
  accent: {
    vars: {
      [colorIndicator]: accent.indicator,
      [colorContrast]: accent.contrast,
      [colorAlpha4]: accent.alpha[4],
      [colorAlpha11]: accent.alpha[11],
      [colorFocus]: accent.solid[8],
    },
  },
  neutral: {
    vars: {
      [colorIndicator]: neutral.indicator,
      [colorContrast]: neutral.contrast,
      [colorAlpha4]: neutral.alpha[4],
      [colorAlpha11]: neutral.alpha[11],
      // Focus outline falls back to accent on the neutral palette so
      // the cue stays distinct against a gray radio — same exception
      // Radix's `--focus-8` codifies.
      [colorFocus]: accent.solid[8],
    },
  },
  danger: {
    vars: {
      [colorIndicator]: danger.indicator,
      [colorContrast]: danger.contrast,
      [colorAlpha4]: danger.alpha[4],
      [colorAlpha11]: danger.alpha[11],
      [colorFocus]: danger.solid[8],
    },
  },
  warning: {
    vars: {
      [colorIndicator]: warning.indicator,
      [colorContrast]: warning.contrast,
      [colorAlpha4]: warning.alpha[4],
      [colorAlpha11]: warning.alpha[11],
      [colorFocus]: warning.solid[8],
    },
  },
  success: {
    vars: {
      [colorIndicator]: success.indicator,
      [colorContrast]: success.contrast,
      [colorAlpha4]: success.alpha[4],
      [colorAlpha11]: success.alpha[11],
      [colorFocus]: success.solid[8],
    },
  },
});

// --- Variant ---

export const variant = styleVariants({
  surface: {
    selectors: {
      '&:where(:not(:checked))::before': {
        backgroundColor: background.surface,
        boxShadow: `inset 0 0 0 1px ${neutral.alpha[7]}`,
      },
      '&:where(:checked)::before': {
        backgroundColor: colorIndicator,
      },
      '&::after': {
        backgroundColor: colorContrast,
      },
      '&:where(:disabled)::before': {
        backgroundColor: neutral.alpha[3],
        boxShadow: `inset 0 0 0 1px ${neutral.alpha[6]}`,
      },
      '&:where(:disabled)::after': {
        backgroundColor: neutral.alpha[8],
      },
    },
  },

  classic: {
    selectors: {
      '&:where(:not(:checked))::before': {
        backgroundColor: background.surface,
        boxShadow: `inset 0 0 0 1px ${neutral.solid[7]}, ${shadow[1]}`,
      },
      '&:where(:checked)::before': {
        backgroundColor: colorIndicator,
        backgroundImage: `linear-gradient(to bottom, ${white[3]}, transparent, ${black[3]})`,
        boxShadow: `inset 0 0.5px 0.5px ${white[4]}, inset 0 -0.5px 0.5px ${black[4]}`,
      },
      '&::after': {
        backgroundColor: colorContrast,
      },
      '&:where(:disabled)::before': {
        backgroundColor: neutral.alpha[3],
        backgroundImage: 'none',
        boxShadow: shadow[1],
      },
      '&:where(:disabled)::after': {
        backgroundColor: neutral.alpha[8],
      },
    },
  },

  soft: {
    selectors: {
      '&::before': {
        backgroundColor: colorAlpha4,
      },
      '&::after': {
        backgroundColor: colorAlpha11,
      },
      // The neutral focus exception above keeps the outline accent-tinted
      // on a gray radio; for soft, drop back to the active palette's
      // alpha[8] so the outline blends with the muted ring (matches Radix).
      '&:where(:focus-visible)::before': {
        outlineColor: colorFocus,
      },
      '&:where(:disabled)::before': {
        backgroundColor: neutral.alpha[3],
      },
      '&:where(:disabled)::after': {
        backgroundColor: neutral.alpha[8],
      },
    },
  },
});

// --- Inline label ---

export const item = style({
  display: 'flex',
  // Default `align-items: stretch` is intentional. Combined with the
  // input's `height: var(--lineHeight, ...)`, it lets the radio stay
  // pinned to the first line of a wrapping label — the input keeps
  // its explicit cross-size and lands at the cross-axis flex-start,
  // while a multi-line span grows downward beside it. Setting
  // `center` here would re-center the radio on the geometric middle
  // of the wrapped block.
  // `0.5em` matches Radix and scales the gap with the label's font
  // size — at smaller sizes the radio sits closer to the text, at
  // larger sizes the gap grows. A fixed token would drift visually
  // across our 1/2/3 size range.
  // eslint-disable-next-line custom/require-design-tokens -- text-relative gap is the design intent here
  gap: '0.5em',
  // Trim the click target to the label's own width so whitespace to
  // the right of the text is not clickable.
  width: 'fit-content',

  selectors: {
    // Disabled cursor must reach the entire label, not just the
    // input. Without this, hovering the label text shows the default
    // cursor across most of the click target.
    '&:where(:has(input:disabled))': {
      cursor: 'not-allowed',
    },
  },
});

export const itemInner = style({
  // Allow text truncation inside the label content.
  minWidth: 0,
});
