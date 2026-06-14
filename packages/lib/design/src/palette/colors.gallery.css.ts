import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

/** Checkerboard tone — subtle enough to read transparency without distracting. */
const check = neutral.solid[3];

/**
 * A single color cell — a small, fixed landscape rectangle. The color rides on
 * top of a checkerboard via the inline `--swatch-color` var, so alpha steps
 * reveal their transparency while opaque (solid) steps simply cover it.
 */
export const swatch = style({
  width: space[9],
  height: space[6],
  borderRadius: radius[2],
  backgroundImage: [
    'linear-gradient(var(--swatch-color), var(--swatch-color))',
    `linear-gradient(45deg, ${check} 25%, transparent 25%)`,
    `linear-gradient(-45deg, ${check} 25%, transparent 25%)`,
    `linear-gradient(45deg, transparent 75%, ${check} 75%)`,
    `linear-gradient(-45deg, transparent 75%, ${check} 75%)`,
  ].join(', '),
  backgroundSize: '100% 100%, 12px 12px, 12px 12px, 12px 12px, 12px 12px',
  backgroundPosition: '0 0, 0 0, 0 6px, 6px -6px, -6px 0',
});
