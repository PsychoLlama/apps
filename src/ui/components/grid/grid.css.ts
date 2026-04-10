import { style, styleVariants } from '@vanilla-extract/css';
import { space } from '#design';

export const base = style({
  display: 'grid',
});

const repeat = (n: number) => `repeat(${n}, minmax(0, 1fr))`;

export const columns = styleVariants({
  1: { gridTemplateColumns: repeat(1) },
  2: { gridTemplateColumns: repeat(2) },
  3: { gridTemplateColumns: repeat(3) },
  4: { gridTemplateColumns: repeat(4) },
  5: { gridTemplateColumns: repeat(5) },
  6: { gridTemplateColumns: repeat(6) },
});

export const rows = styleVariants({
  1: { gridTemplateRows: repeat(1) },
  2: { gridTemplateRows: repeat(2) },
  3: { gridTemplateRows: repeat(3) },
  4: { gridTemplateRows: repeat(4) },
  5: { gridTemplateRows: repeat(5) },
  6: { gridTemplateRows: repeat(6) },
});

export const align = styleVariants({
  start: { alignItems: 'start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'end' },
  stretch: { alignItems: 'stretch' },
});

export const justify = styleVariants({
  start: { justifyItems: 'start' },
  center: { justifyItems: 'center' },
  end: { justifyItems: 'end' },
  stretch: { justifyItems: 'stretch' },
});

export const gap = styleVariants(space, (value) => ({ gap: value }));
export const gapX = styleVariants(space, (value) => ({ columnGap: value }));
export const gapY = styleVariants(space, (value) => ({ rowGap: value }));
