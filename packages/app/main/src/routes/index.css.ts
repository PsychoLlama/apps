import { style } from '@vanilla-extract/css';
import { accent, fast, radius, space, standard } from '@lib/design';

export const topBar = style({
  // Reserve the iOS status-bar / notch region above the actions, same
  // trick as SiteHeader: `viewport-fit=cover` (entry-server) makes the
  // inset non-zero on notched devices; it resolves to 0 everywhere else.
  paddingTop: `calc(${space[2]} + env(safe-area-inset-top))`,
  paddingBottom: space[2],
});

export const grid = style({
  width: '100%',
  maxWidth: '880px',
  listStyle: 'none',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
});

export const item = style({
  display: 'contents',
});

export const card = style({
  height: '100%',
});

export const iconTile = style({
  width: space[7],
  height: space[7],
  borderRadius: radius[3],
  flexShrink: 0,
  background: accent.alpha[3],
  color: accent.solid[11],
  transition: `background-color ${fast[2]} ${standard.productive}`,
  selectors: {
    [`${card}:hover &, ${card}:focus-visible &`]: {
      background: accent.alpha[4],
    },
  },
});
