import { style, styleVariants } from '@vanilla-extract/css';
import { accent, black, space } from '@lib/design';

/**
 * Full-viewport stage for the live feed. Fixed over the page on an
 * opaque black backdrop so any letterboxing during camera spin-up reads
 * as intentional, not a flash of page. No `z-index` needed — the header
 * and landing are unmounted while streaming, so this is the only painted
 * layer.
 */
export const viewport = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: black.step12,
});

/** The feed itself — fills the stage, cropping to cover rather than letterbox. */
export const video = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

/**
 * Centered scan-region window. Sized to a square that fits portrait or
 * landscape, it dims everything outside itself with a single oversized
 * box-shadow spill — cheaper and crisper than a separate mask element —
 * so the eye lands on where the code should go. Purely decorative; it
 * doesn't actually clip decoding (that lands with the decoder).
 */
export const reticle = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(70vw, 60vh)',
  aspectRatio: '1',
  boxShadow: `0 0 0 100vmax ${black.step7}`,
  // Click-through so the window never steals taps from the controls.
  pointerEvents: 'none',
});

/**
 * A single accent stroke — the arm of a corner angle. Only the two sides
 * that meet at a given corner carry it, so each corner draws a sharp
 * right angle (an L), not a full box. Plain per-side borders; no SVG or
 * border-image needed.
 */
const arm = `3px solid ${accent.solid[9]}`;

/**
 * One corner angle of the scan window. Fixed-size and unrounded so it
 * reads as a targeting bracket. Inset from the window edge by a small gap
 * so the angles float just inside the scan region rather than tracing its
 * full perimeter. The variants pin each to a corner and light its two
 * inward-facing borders.
 */
const corner = style({
  position: 'absolute',
  width: space[6],
  height: space[6],
});

/** The four corner angles, each inset into its corner with its two borders lit. */
export const corners = styleVariants({
  topLeft: [
    corner,
    { top: space[3], left: space[3], borderTop: arm, borderLeft: arm },
  ],
  topRight: [
    corner,
    { top: space[3], right: space[3], borderTop: arm, borderRight: arm },
  ],
  bottomLeft: [
    corner,
    { bottom: space[3], left: space[3], borderBottom: arm, borderLeft: arm },
  ],
  bottomRight: [
    corner,
    {
      bottom: space[3],
      right: space[3],
      borderBottom: arm,
      borderRight: arm,
    },
  ],
});

/**
 * Overlay rail for the feed's controls, pinned to the bottom-center
 * within thumb reach. Sits above the video and clears the home-bar /
 * notch via the safe-area inset.
 */
export const controls = style({
  position: 'absolute',
  insetInline: 0,
  bottom: `calc(${space[6]} + env(safe-area-inset-bottom))`,
  justifyContent: 'center',
});
