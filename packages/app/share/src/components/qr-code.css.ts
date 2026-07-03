import { style } from '@vanilla-extract/css';
import { black, radius, shadow, white } from '@lib/design';

/**
 * The QR plate: a fixed light backing that stays put across light and dark
 * themes. QR readers expect dark-on-light, so the colors pin to the opaque
 * black/white tokens rather than the theme-reactive surfaces — an inverted
 * code many scanners refuse. `fit-content` keeps the plate square around the
 * code and lets the column lay it out flush-left.
 */
export const plate = style({
  display: 'block',
  width: 'fit-content',
  backgroundColor: white.step12,
  color: black.step12,
  borderRadius: radius[4],
  boxShadow: shadow[2],
});

/**
 * The code itself. A fixed square, capped at the container width on narrow
 * screens; `crispEdges` on the SVG keeps module borders sharp at any size.
 */
export const canvas = style({
  display: 'block',
  width: '10rem',
  maxWidth: '100%',
  height: 'auto',
  aspectRatio: '1 / 1',
});
