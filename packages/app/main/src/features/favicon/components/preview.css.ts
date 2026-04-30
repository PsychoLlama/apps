import { style } from '@vanilla-extract/css';

// The frame is just a sized container — the rendered SVG carries its
// own background fill and rounded corners (matching the favicon's shape
// mask), so anywhere outside the rounded shape stays transparent and
// the parent's surface (the workspace dot grid) shows through.
export const frame = style({
  position: 'relative',
  flexShrink: 0,
});
