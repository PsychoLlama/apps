import { keyframes, style } from '@vanilla-extract/css';
import { slow, standard } from '@lib/design';

// The frame is just a sized container — the rendered SVG carries its
// own background fill and rounded corners (matching the icon's shape
// mask), so anywhere outside the rounded shape stays transparent and
// the parent's surface (the workspace dot grid) shows through.
export const frame = style({
  position: 'relative',
  flexShrink: 0,
});

// Pulse the rendered canvas opacity while an icon resolution is in
// flight. Animates `opacity` rather than the host bg so whatever's
// already on the canvas (blueprint placeholder or a stale icon)
// stays visible underneath the pulse.
const pulse = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0.55 },
});

export const loading = style({
  animation: `${pulse} ${slow[2]} ${standard.productive} infinite alternate`,
});
