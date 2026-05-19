import { style } from '@vanilla-extract/css';
import { black, neutral, space } from '@lib/design';

// Scanner stage takes every pixel below the SiteHeader. The camera is
// the focal point until a detection lands; details slide in below as a
// natural-height row, pushing nothing else around.
export const stage = style({
  flex: '1 1 auto',
  minHeight: 0,
});

// Frame is the camera viewport — full-bleed black box that fills the
// remaining vertical space. `min-height: 0` is required so it can
// shrink inside the column flex parent.
export const frame = style({
  position: 'relative',
  flex: '1 1 auto',
  minHeight: 0,
  width: '100%',
  background: black.step12,
  overflow: 'hidden',
});

export const video = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

// SVG overlay sits exactly on top of the video; matching viewBox +
// `xMidYMid slice` keeps the polygon glued to the same pixels the video
// renders under `object-fit: cover`.
export const overlay = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
});

export const polygon = style({
  fill: 'none',
  stroke: neutral.solid[12],
  strokeWidth: 4,
  strokeLinejoin: 'round',
});

// Details panel renders below the camera with breathing room. Padding
// is the wrapper's job — Card / DataList own their own internal rhythm.
export const details = style({
  paddingBlock: space[4],
  paddingInline: space[4],
});

// Compact wrapper for the unsupported/error Callout — the previous
// Section size={3} (64px top + bottom) crowded small viewports.
export const callout = style({
  paddingBlock: space[5],
  paddingInline: space[4],
});
