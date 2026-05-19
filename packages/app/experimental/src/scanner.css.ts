import { style } from '@vanilla-extract/css';
import { black, neutral, space } from '@lib/design';

// Scanner stage takes every pixel below the SiteHeader. `flex-basis: 0`
// (not the default `auto`) is the important bit: with `auto`, the flex
// container sizes from the video's intrinsic `videoWidth`/`videoHeight`
// — which on Chromium-Android is the full camera resolution, and the
// stage cheerfully grows past the viewport. Starting basis at zero
// makes the flex layout share the remaining space among growers rather
// than letting content size leak up.
export const stage = style({
  flex: '1 1 0',
  minHeight: 0,
  minWidth: 0,
});

// Frame is the camera viewport — full-bleed black box that fills the
// remaining vertical space. Same `flex: 1 1 0` rationale as `stage`;
// the width/max-width pair belt-and-suspenders a `<video>` element
// whose intrinsic dimensions can still propagate to the wrapper if it
// has any room.
export const frame = style({
  position: 'relative',
  flex: '1 1 0',
  minHeight: 0,
  minWidth: 0,
  width: '100%',
  maxWidth: '100%',
  background: black.step12,
  overflow: 'hidden',
});

export const video = style({
  display: 'block',
  width: '100%',
  maxWidth: '100%',
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
});
