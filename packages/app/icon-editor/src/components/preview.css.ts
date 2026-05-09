import { style } from '@vanilla-extract/css';
import { neutral } from '@lib/design';

// The frame is just a sized container — the rendered SVG carries its
// own background fill and rounded corners (matching the icon's shape
// mask), so anywhere outside the rounded shape stays transparent and
// the parent's surface (the workspace dot grid) shows through.
export const frame = style({
  position: 'relative',
  flexShrink: 0,
});

// Skeleton bg painted while an icon resolution is in flight. Static
// neutral alpha, no animation — typical resolutions land in under a
// second, which is too short for a pulse to read as anything but a
// blink. Host sets `border-radius` inline to match the active shape
// mask so the placeholder reads as the canvas the icon will land in.
export const loading = style({
  backgroundColor: neutral.alpha[3],
});
