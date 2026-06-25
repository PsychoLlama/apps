import { style } from '@vanilla-extract/css';
import { neutral, radius } from '@lib/design';

/**
 * A faint diagonal hatch behind a hairline outline — the shared "for-show
 * placeholder" fill for `@lib/ui`'s layout listings (Container, Flex, Grid,
 * Section). Those demos arrange empty boxes to show how a layout distributes
 * space; the hatch marks each box as a stand-in for real content. Compose it
 * with explicit dimensions: `style([hatch, { height: space[8] }])`.
 *
 * Translated from Radix's 6×6 SVG tile: a 1-unit-thick diagonal band (the strip
 * between `x+y=5` and `x+y=6`) repeated every 6 units. Projected onto the 45°
 * gradient line those axis distances shrink by √2 — a 1/√2px (≈0.7071) stripe on
 * a 6/√2px (≈4.2426) period, a 1/6 duty cycle. The background is clipped to the
 * padding box so the stripes stay inside the border instead of bleeding under it.
 *
 * Deliberately a sibling of `@lib/design`'s own `gallery/hatch.css`, not a shared
 * import: `@lib/gallery` (the only package both could import from) is a types-only
 * leaf, and pulling design tokens into it forms a build cycle. We pay duplication
 * to keep the layering intact.
 */
export const hatch = style({
  borderRadius: radius[1],
  border: `1px solid ${neutral.alpha[5]}`,
  backgroundColor: neutral.alpha[3],
  backgroundImage: `repeating-linear-gradient(-45deg, ${neutral.alpha[5]} 0, ${neutral.alpha[5]} 0.7071px, transparent 0.7071px, transparent 4.2426px)`,
  backgroundClip: 'padding-box',
});
