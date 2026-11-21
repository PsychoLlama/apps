import { style } from '@vanilla-extract/css';
import { accent, background, radius, space } from '@lib/design';

/**
 * What the page shows while something hovers over it, waiting to be
 * dropped: a dashed frame just inside the page's edges, over everything,
 * veiling what's under it enough that its own words can be read.
 *
 * Positioned against the shell's frame and rendered last in it, so it
 * paints over the rest by order alone.
 *
 * It takes no pointer events. The drag is the page's to hear, and an
 * overlay that caught it would count as the drag leaving everything
 * under it.
 */
export const overlay = style({
  position: 'absolute',
  inset: space[3],
  border: `2px dashed ${accent.solid[8]}`,
  borderRadius: radius[4],
  backgroundColor: `color-mix(in srgb, ${background.page} 88%, transparent)`,
  color: accent.solid[11],
  pointerEvents: 'none',
});

/** The mark over the words. */
export const mark = style({
  display: 'flex',
});
