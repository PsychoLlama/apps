import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

/**
 * Decorative diagonal-hatch fill shared by the radius and shadow swatches.
 * Those scales carry no real content, so an empty box recedes into the canvas.
 * A faint repeating stripe marks each one as a for-show sample while still
 * giving it a surface: the radius corners clip the hatch so the rounding reads,
 * and the shadow panel gains a face to lift off the page. Defined once so the
 * two scales stay visually identical — they're meant to read as one object.
 *
 * Alpha stripes over an alpha base so the fill rides on top of whatever surface
 * the cell sits on and tracks light/dark without per-mode rules.
 */
export const hatch = style({
  backgroundColor: neutral.alpha[2],
  backgroundImage: `repeating-linear-gradient(45deg, ${neutral.alpha[5]} 0, ${neutral.alpha[5]} 1px, transparent 1px, transparent ${space[2]})`,
});
