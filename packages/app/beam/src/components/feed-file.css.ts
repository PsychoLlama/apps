import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

/**
 * A shared file's tile. One size whatever the file, so a feed of them
 * lines up and nothing jumps when a picture finishes arriving.
 */
export const tile = style({
  display: 'flex',
  flexDirection: 'column',
  width: '16rem',
  maxWidth: '100%',
  border: `1px solid ${neutral.solid[6]}`,
  borderRadius: radius[3],
  overflow: 'hidden',
});

/** Where the picture goes, or what stands in for one. */
export const preview = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space[2],
  height: '9rem',
  backgroundColor: neutral.solid[3],
});

/** A preview that's words and not a picture keeps off the tile's edges. */
export const stated = style({
  padding: space[3],
});

/** A picture fills the preview edge to edge, cropped to fit. */
export const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

/** The file's name and size, and the way to save it. */
export const caption = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: space[3],
  padding: `${space[2]} ${space[3]}`,
});

/** The name gives way to the button, and is cut short when it must be. */
export const label = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
});
