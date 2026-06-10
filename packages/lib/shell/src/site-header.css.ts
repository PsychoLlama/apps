import { style } from '@vanilla-extract/css';
import { accent, fontWeight, neutral, space, text } from '@lib/design';

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
  // Pin the bar to one height on every route. Ghost buttons retract
  // their padding via negative margins and the launcher swaps the root
  // link for plain text, so without a floor the content height drifts
  // a few pixels between pages.
  minHeight: space[6],
  // Ghost buttons inherit font weight; match the crumbs' medium so the
  // root link reads as part of the breadcrumb.
  fontWeight: fontWeight.medium,
});

// Marks the launcher as the place you're already standing: the glyph
// takes the accent while the label runs high-contrast, in deliberate
// contrast to the muted link the root renders as on every other page.
export const brand = style({
  color: accent.solid[11],
});

export const separator = style({
  color: text.lowContrast,
  flexShrink: 0,
});

export const trailing = style({
  marginInlineStart: 'auto',
});
