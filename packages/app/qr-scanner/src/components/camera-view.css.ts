import { style, styleVariants } from '@vanilla-extract/css';
import { black, radius, space, white } from '@lib/design';

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
  borderRadius: radius[5],
  boxShadow: `0 0 0 100vmax ${black.step7}`,
  // Click-through so the window never steals taps from the controls.
  pointerEvents: 'none',
});

/**
 * One bracketed corner of the scan window. Two adjacent borders plus the
 * matching outer radius trace an L that hugs the reticle's rounded edge.
 * Positioned and rounded per corner by the variants below.
 */
const corner = style({
  position: 'absolute',
  width: space[6],
  height: space[6],
  borderColor: white.step12,
  borderStyle: 'solid',
});

/** The four corners, each pinned to its edge with the right two borders lit. */
export const corners = styleVariants({
  topLeft: [
    corner,
    {
      top: 0,
      left: 0,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: radius[5],
    },
  ],
  topRight: [
    corner,
    {
      top: 0,
      right: 0,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: radius[5],
    },
  ],
  bottomLeft: [
    corner,
    {
      bottom: 0,
      left: 0,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: radius[5],
    },
  ],
  bottomRight: [
    corner,
    {
      bottom: 0,
      right: 0,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: radius[5],
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
