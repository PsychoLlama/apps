import { style } from '@vanilla-extract/css';
import { neutral, space, text } from '@lib/design';

export const header = style({
  borderBottom: `1px solid ${neutral.solid[6]}`,
  flexShrink: 0,
  // Reserve the iOS status-bar / notch region above the bar: the
  // background and border bleed under it while content stays clear.
  // `viewport-fit=cover` (entry-server) makes the inset non-zero on
  // notched devices; it resolves to 0 everywhere else. Vertical padding
  // lives here rather than the Flex `py` prop so the top inset composes
  // onto the base value without a cascade-order fight.
  paddingTop: `calc(${space[2]} + env(safe-area-inset-top))`,
  paddingBottom: space[2],
});

export const separator = style({
  color: text.lowContrast,
  flexShrink: 0,
});

export const trailing = style({
  marginInlineStart: 'auto',
});
