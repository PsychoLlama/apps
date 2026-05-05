import { style, styleVariants } from '@vanilla-extract/css';
import { radius, space } from '@lib/design';
import { swatch } from '@lib/theme/catalog';

/**
 * Override for the radio group container. Replaces the default auto-
 * fit `1fr` tracks with a fixed `7.5rem` track so cards stay compact
 * and consistently sized (auto-fill needs a fixed track size; intrinsic
 * sizing functions like `max-content` or `fit-content()` aren't valid
 * in `repeat(auto-fill, ...)`).
 */
export const root = style({
  gridTemplateColumns: 'repeat(auto-fill, 7.5rem)',
});

/**
 * Base for theme-tinted radio cards. Aligns content to the start so
 * the `::before` swatch sits on the left edge of the card, and paints
 * the swatch as a `::before` pseudo so the visible card stays a single
 * element — no extra DOM nodes inside the `<label>`.
 */
export const swatchBase = style({
  justifyContent: 'flex-start',
  selectors: {
    '&::before': {
      content: '""',
      width: space[4],
      height: space[4],
      borderRadius: radius.full,
      flexShrink: 0,
    },
  },
});

/**
 * Per-theme background color for the `::before` swatch. Pulls each
 * theme's accent from `@lib/theme/catalog` — the colors are baked into
 * CSS at build time, so unselected themes don't leak into the runtime
 * bundle.
 */
export const swatchTint = styleVariants(swatch, (color) => ({
  selectors: {
    '&::before': { backgroundColor: color },
  },
}));
