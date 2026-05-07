import { style } from '@vanilla-extract/css';
import { neutral } from '@lib/design';

// Fixed-size demo viewport with a visible boundary so overflow has
// somewhere to overflow into. Layout primitives don't take arbitrary
// widths/heights or borders; the radius and surface background ride
// through `<Flex>`'s box props instead.
export const frame = style({
  width: '16rem',
  height: '12rem',
  border: `1px solid ${neutral.alpha[6]}`,
});

// Decorative tile placeholder. Uses translucent neutral fill + outline
// instead of a `background` token so the tiles read as distinct chips
// in both light and dark modes — the four `BackgroundColor` tokens
// (page/panelSolid/panelTranslucent/surface) all collapse to near-equal
// values in light mode and don't contrast well against the surface
// frame. `flex-shrink: 0` keeps the row overflowing horizontally.
export const tile = style({
  width: '4rem',
  height: '4rem',
  flexShrink: 0,
  backgroundColor: neutral.alpha[4],
  border: `1px solid ${neutral.alpha[6]}`,
});
