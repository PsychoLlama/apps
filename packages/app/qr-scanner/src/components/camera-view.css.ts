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
 * One corner angle of the scan window. Two adjacent borders draw a sharp
 * right angle that brackets the corner; the variants below pin it to an
 * edge and pick which two borders to light. Fixed-size, unrounded — the
 * angles read as a targeting frame, not a rounded box.
 */
const corner = style({
  position: 'absolute',
  width: space[6],
  height: space[6],
  borderColor: accent.solid[9],
  borderStyle: 'solid',
});

/** The four corner angles, each pinned to its edge with the right two borders lit. */
export const corners = styleVariants({
  topLeft: [corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }],
  topRight: [
    corner,
    { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  ],
  bottomLeft: [
    corner,
    { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  ],
  bottomRight: [
    corner,
    { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
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
