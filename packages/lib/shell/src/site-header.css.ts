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

export const nav = style({
  // Pin the bar to one height on every route. The launcher's actions
  // slot is taller than the breadcrumb text, so without a floor the
  // content height would drift a few pixels between pages.
  minHeight: space[6],
});

// The root link carries the wordmark glyph, and `Link` lays out as
// inline text — flex alignment keeps the icon vertically centered
// against the label instead of sitting on the baseline.
export const home = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: space[1],
});

// The launcher's wordmark glyph. Same quiet color as everything else
// in the bar — location is signaled by weight and the absence of a
// trail, never by contrast.
export const brand = style({
  color: text.lowContrast,
});

export const separator = style({
  color: text.lowContrast,
  flexShrink: 0,
});

export const trailing = style({
  marginInlineStart: 'auto',
});
