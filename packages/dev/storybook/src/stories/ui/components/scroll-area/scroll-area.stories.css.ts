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

// Decorative tile placeholder. `<Flex>` paints the radius and surface
// background; this class only sets explicit dimensions and stops the
// flex container from squeezing the tiles together when overflow
// kicks in. The row's overall width comes from the ScrollArea's
// children reset (`width: fit-content`) plus these flex-shrink: 0
// children — no `width: max-content` needed on the wrapper.
export const tile = style({
  width: '4rem',
  height: '4rem',
  flexShrink: 0,
});
