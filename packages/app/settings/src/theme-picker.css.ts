import { style, styleVariants } from '@vanilla-extract/css';
import { radius, space } from '@lib/design';
import { swatch } from '@lib/theme/swatch';

/**
 * Override for the radio group container. Tightens the default min track
 * size so theme cards stay compact, but keeps the `1fr` upper bound so
 * every visible column shares the row width equally and the gallery
 * reflows cleanly across breakpoints.
 */
export const root = style({
  gridTemplateColumns: 'repeat(auto-fit, minmax(7.5rem, 1fr))',
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
 * theme's accent from `@lib/theme/swatch` — the colors are baked into
 * CSS at build time, so unselected themes don't leak into the runtime
 * bundle.
 */
export const swatchTint = styleVariants(swatch, (color) => ({
  selectors: {
    '&::before': { backgroundColor: color },
  },
}));
