import { style } from '@vanilla-extract/css';

// Fixed-size demo viewport so overflow has somewhere to overflow into.
// Layout primitives don't take arbitrary widths/heights; the rest of
// the visual chrome (border, radius, surface background) comes from
// `<Card>`.
export const frame = style({
  width: '16rem',
  height: '12rem',
});

// Force the row of tiles to take its natural width inside the
// ScrollArea so it overflows the frame and the horizontal scrollbar
// has something to do.
export const wide = style({
  width: 'max-content',
});

// Decorative tile placeholder. `<Flex>` paints the radius and surface
// background; this class only sets explicit dimensions and stops the
// flex container from squeezing the tiles together when overflow
// kicks in.
export const tile = style({
  width: '4rem',
  height: '4rem',
  flexShrink: 0,
});
