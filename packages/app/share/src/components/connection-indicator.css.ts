import { keyframes, style } from '@vanilla-extract/css';
import { slow, success, text } from '@lib/design';

/** Inline-flex so the glyph centers in the header's actions tray. */
export const root = style({
  display: 'inline-flex',
  alignItems: 'center',
});

// One continuous rotation. `linear` keeps the spin steady — the motion
// easing curves are for start/stop transitions, not loops. Riding `slow[2]`
// (an ambient duration) means the animation collapses to a static glyph
// under `prefers-reduced-motion` for free, the same trick the skeleton pulse
// uses.
const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

/** Connecting glyph — a low-contrast spinner that folds into the chrome. */
export const spinner = style({
  color: text.lowContrast,
  animation: `${spin} ${slow[2]} linear infinite`,
});

/** Connected glyph — a positive-tinted confirmation. */
export const connected = style({
  color: success.solid[11],
});

// Keeps the status copy out of view while leaving it in the accessibility
// tree for the `<output>` live region to announce. Mirrors the visually-
// hidden input pattern in `@lib/ui`'s radio-cards.
export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
});
