import { style } from '@vanilla-extract/css';
import { neutral } from '@lib/design';

/**
 * Decorative diagonal-hatch fill shared by the radius and shadow swatches.
 * Those scales carry no real content, so an empty box recedes into the canvas;
 * a faint repeating stripe marks each one as a for-show sample while still
 * giving it a surface — the radius corners clip the fill so the rounding reads,
 * and the shadow panel gains a face to lift off the page. Defined once so the
 * two scales stay visually identical: they're meant to read as one object.
 *
 * Translated from Radix's 6×6 SVG tile: a 1-unit-thick diagonal band (the strip
 * between `x+y=5` and `x+y=6`) repeated every 6 units. Projected onto the 45°
 * gradient line those axis distances shrink by √2 — a 1/√2px (≈0.7071) stripe on
 * a 6/√2px (≈4.2426) period, a 1/6 duty cycle. The fill clips to the padding box
 * so the stripes stay inside any border a consumer adds instead of bleeding under it.
 *
 * Fill only — no border or radius. Consumers frame it themselves: the radius box
 * adds a crisp border and the per-cell corner, while the shadow panel stays
 * borderless so its lowest elevations don't double their hairline edge. The
 * frameless sibling of `@lib/ui`'s `gallery/style` hatch, which bundles a default
 * frame for its bare layout tiles; the stripe geometry is shared between them.
 *
 * Alpha stripes over an alpha base so the fill rides on whatever surface the cell
 * sits on and tracks light/dark without per-mode rules.
 */
export const hatch = style({
  backgroundColor: neutral.alpha[3],
  backgroundImage: `repeating-linear-gradient(-45deg, ${neutral.alpha[5]} 0, ${neutral.alpha[5]} 0.7071px, transparent 0.7071px, transparent 4.2426px)`,
  backgroundClip: 'padding-box',
});
