/**
 * Checkbox styles.
 *
 * Ported from Radix UI Themes BaseCheckbox. The native
 * `<input type="checkbox">` is the styling host: `appearance: none`
 * strips the user-agent control, `::before` paints the box, and
 * `::after` paints the indicator (a checkmark or a horizontal divider)
 * via a swapped `mask-image`.
 *
 * Deviations from Radix:
 * - State driven by the native `:checked` and `:indeterminate`
 *   pseudo-classes rather than `data-state` data-attrs — same behavior,
 *   no JS-managed attributes, predicates stay tied to the input's
 *   intrinsic state.
 * - Indicator drawn via `mask-image` instead of an SVG child element.
 *   A native `<input>` is a void element, so the indicator can't be a
 *   DOM child; the same Thick check / divider paths Radix ships are
 *   inlined as data URIs and tinted with `background-color`.
 * - `color` accepts every semantic palette (accent / neutral / danger /
 *   warning / success). Radix exposes a hand-picked subset.
 * - Drops the high-contrast variant.
 *
 * @see https://www.radix-ui.com/themes/docs/components/checkbox
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
// Vite's `?inline` suffix returns the asset as a base64 data URI string,
// which is exactly the form `mask-image: url(...)` wants. Keeps the SVG
// paths in their own files (greppable, syntax-highlightable) instead of
// inlined as escaped strings in CSS.
import checkUrl from './icons/check.svg?inline';
import indeterminateUrl from './icons/indeterminate.svg?inline';

// Vars set by the `size` and `color` variants and read by every other
// rule below — assigning a single variant reaches the entire element.
const checkboxSize = createVar();
const checkboxRadius = createVar();
const indicatorSize = createVar();
const colorIndicator = createVar();
const colorContrast = createVar();
const colorAlpha5 = createVar();
const colorAlpha11 = createVar();
const colorFocus = createVar();

// `mask-image` consumes the alpha channel of the SVG; the path's `fill`
// is irrelevant once the icon is used as a mask. `background-color` on
// the same `::after` provides the tint.
const CHECK_MASK_URL = `url(${JSON.stringify(checkUrl)})`;
const INDETERMINATE_MASK_URL = `url(${JSON.stringify(indeterminateUrl)})`;

// --- Root (the styled `<input type="checkbox">`) ---

export const root = style({
  appearance: 'none',
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  verticalAlign: 'top',
  width: checkboxSize,
  // Track the surrounding text's line-height when present so the
  // checkbox sits flush against the first line of a wrapping label
  // rather than drifting to the geometric center of the wrapped block.
  // The `lineHeight` var is set by the wrapping `<Text as="label">`
  // (size variants in `text.css`) and inherits to this descendant via
  // the CSS custom-property cascade. Standalone checkboxes fall back
  // to `checkboxSize`. The box and indicator below stay sized to
  // `checkboxSize` / `indicatorSize` so only the click box stretches;
  // the visible square keeps its diameter.
  //
  // The outer `max(..., checkboxSize)` guards against a smaller-text
  // ancestor shrinking the root below the visible box — Radix has the
  // same opportunity but doesn't take it.
  height: `max(${fallbackVar(lineHeight, checkboxSize)}, ${checkboxSize})`,
  cursor: 'pointer',
  // The indicator is an affordance — keep it out of label text selection.
  userSelect: 'none',

  // Box. `::before` is the visible square; the input itself is a flex
  // container that holds the indicator via `::after`.
  '::before': {
    content: '""',
    display: 'block',
    width: checkboxSize,
    height: checkboxSize,
    borderRadius: checkboxRadius,
  },

  // Indicator. Sized to `indicatorSize` and centered by the parent's
  // flex. `mask-image` is set per-state below so the same `::after`
  // shape doubles as both checkmark (when `:checked`) and divider
  // (when `:indeterminate`).
  '::after': {
    pointerEvents: 'none',
    position: 'absolute',
    width: indicatorSize,
    height: indicatorSize,
    backgroundColor: 'transparent',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: 'contain',
  },

  selectors: {
    '&:where(:checked, :indeterminate)::after': {
      content: '""',
    },
    '&:where(:checked)::after': {
      maskImage: CHECK_MASK_URL,
    },
    '&:where(:indeterminate)::after': {
      maskImage: INDETERMINATE_MASK_URL,
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
//
// Radix's checkbox sizes: 1 = 0.875 × space[4], 2 = space[4],
// 3 = 1.25 × space[4]. The indicator scales independently because
// Radix tunes its baseline against pixel sizes rather than the box.
// Border radius scales with the box so a small checkbox doesn't read
// as comparatively rounder than a large one.

export const size = styleVariants({
  1: {
    vars: {
      [checkboxSize]: `calc(${space[4]} * 0.875)`,
      [checkboxRadius]: `calc(${radius[1]} * 0.875)`,
      [indicatorSize]: '9px',
    },
  },
  2: {
    vars: {
      [checkboxSize]: space[4],
      [checkboxRadius]: radius[1],
      [indicatorSize]: '10px',
    },
  },
  3: {
    vars: {
      [checkboxSize]: `calc(${space[4]} * 1.25)`,
      [checkboxRadius]: `calc(${radius[1]} * 1.25)`,
      [indicatorSize]: '12px',
    },
  },
});

// --- Color ---
//
// Each color binds the four palette refs the rest of the stylesheet
// reads: `indicator` paints the box on checked surface/classic;
// `contrast` paints the icon on those variants; `alpha[5]` paints the
// soft box; `alpha[11]` paints the soft icon; `solid[8]` drives the
// focus outline so it tracks the active color.

export const color = styleVariants({
  accent: {
    vars: {
      [colorIndicator]: accent.indicator,
      [colorContrast]: accent.contrast,
      [colorAlpha5]: accent.alpha[5],
      [colorAlpha11]: accent.alpha[11],
      [colorFocus]: accent.solid[8],
    },
  },
  neutral: {
    vars: {
      [colorIndicator]: neutral.indicator,
      [colorContrast]: neutral.contrast,
      [colorAlpha5]: neutral.alpha[5],
      [colorAlpha11]: neutral.alpha[11],
      // Focus outline falls back to accent on the neutral palette so
      // the cue stays distinct against a gray checkbox — same exception
      // Radix's `--focus-8` codifies.
      [colorFocus]: accent.solid[8],
    },
  },
  danger: {
    vars: {
      [colorIndicator]: danger.indicator,
      [colorContrast]: danger.contrast,
      [colorAlpha5]: danger.alpha[5],
      [colorAlpha11]: danger.alpha[11],
      [colorFocus]: danger.solid[8],
    },
  },
  warning: {
    vars: {
      [colorIndicator]: warning.indicator,
      [colorContrast]: warning.contrast,
      [colorAlpha5]: warning.alpha[5],
      [colorAlpha11]: warning.alpha[11],
      [colorFocus]: warning.solid[8],
    },
  },
  success: {
    vars: {
      [colorIndicator]: success.indicator,
      [colorContrast]: success.contrast,
      [colorAlpha5]: success.alpha[5],
      [colorAlpha11]: success.alpha[11],
      [colorFocus]: success.solid[8],
    },
  },
});

// --- Variant ---

export const variant = styleVariants({
  surface: {
    selectors: {
      '&:where(:not(:checked, :indeterminate))::before': {
        backgroundColor: background.surface,
        boxShadow: `inset 0 0 0 1px ${neutral.alpha[7]}`,
      },
      '&:where(:checked, :indeterminate)::before': {
        backgroundColor: colorIndicator,
      },
      '&:where(:checked, :indeterminate)::after': {
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
      '&:where(:not(:checked, :indeterminate))::before': {
        backgroundColor: background.surface,
        boxShadow: `inset 0 0 0 1px ${neutral.solid[7]}, ${shadow[1]}`,
      },
      '&:where(:checked, :indeterminate)::before': {
        backgroundColor: colorIndicator,
        backgroundImage: `linear-gradient(to bottom, ${white.step3}, transparent, ${black.step3})`,
        boxShadow: `inset 0 0.5px 0.5px ${white.step4}, inset 0 -0.5px 0.5px ${black.step4}`,
      },
      '&:where(:checked, :indeterminate)::after': {
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
        backgroundColor: colorAlpha5,
      },
      '&:where(:checked, :indeterminate)::after': {
        backgroundColor: colorAlpha11,
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
  // input's `height: var(--lineHeight, ...)`, it lets the checkbox
  // stay pinned to the first line of a wrapping label — the input
  // keeps its explicit cross-size and lands at the cross-axis flex-start,
  // while a multi-line span grows downward beside it. Setting `center`
  // here would re-center the checkbox on the geometric middle of the
  // wrapped block.
  // `0.5em` matches Radix and scales the gap with the label's font
  // size — at smaller sizes the checkbox sits closer to the text, at
  // larger sizes the gap grows. A fixed token would drift visually
  // across our 1/2/3 size range.
  // eslint-disable-next-line custom/require-design-tokens -- text-relative gap is the design intent here
  gap: '0.5em',
  // Trim the click target to the label's own width so whitespace to
  // the right of the text is not clickable.
  width: 'fit-content',

  selectors: {
    // Disabled cursor must reach the entire label, not just the input.
    // Without this, hovering the label text shows the default cursor
    // across most of the click target.
    '&:where(:has(input:disabled))': {
      cursor: 'not-allowed',
    },
  },
});

export const itemInner = style({
  // Allow text truncation inside the label content.
  minWidth: 0,
});
