import { style, styleVariants } from '@vanilla-extract/css';
import { accent, black, breakpoint, space } from '@lib/design';

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
  // Center within the *safe* area, not the raw viewport: a notch or
  // home indicator makes the usable region asymmetric, so plain 50%
  // would drift the window toward the intruded edge. Shifting the
  // center point by half the difference of the opposing insets pulls it
  // back to the optical center. Collapses to 50% when insets are 0.
  top: 'calc(50% + (env(safe-area-inset-top) - env(safe-area-inset-bottom)) / 2)',
  left: 'calc(50% + (env(safe-area-inset-left) - env(safe-area-inset-right)) / 2)',
  transform: 'translate(-50%, -50%)',
  // Small-viewport units (`svw`/`svh`), not `vw`/`vh`: the legacy units
  // measure against the viewport with mobile browser chrome retracted,
  // so the window could overshoot while the URL bar is showing. `dvh`
  // would track chrome live and make the window resize as the bar
  // slides; `svh` picks the smallest visible area and stays put.
  width: 'min(70svw, 60svh)',
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
const strokeWidth = '3px';
const arm = `${strokeWidth} solid ${accent.solid[9]}`;

// Nudge each bracket out by exactly its stroke width so its arms rest
// flush just *outside* the window edges (their inner edge aligns with
// the window), rather than overlapping or floating away from it.
const outset = `calc(-1 * ${strokeWidth})`;

/**
 * One corner angle of the scan window. Fixed-size and unrounded so it
 * reads as a targeting bracket. Sits just *outside* the window, hugging
 * the corner: each variant offsets the element outward by the stroke
 * width on two axes and lights the two borders facing those edges, so
 * the L's arms run along the outside of the window's corner.
 */
const corner = style({
  position: 'absolute',
  width: space[6],
  height: space[6],
});

/** The four corner angles, each hugging the outside of its corner. */
export const corners = styleVariants({
  topLeft: [
    corner,
    { top: outset, left: outset, borderTop: arm, borderLeft: arm },
  ],
  topRight: [
    corner,
    { top: outset, right: outset, borderTop: arm, borderRight: arm },
  ],
  bottomLeft: [
    corner,
    { bottom: outset, left: outset, borderBottom: arm, borderLeft: arm },
  ],
  bottomRight: [
    corner,
    { bottom: outset, right: outset, borderBottom: arm, borderRight: arm },
  ],
});

/**
 * Overlay rail for the feed's controls, pinned to the bottom within
 * thumb reach. Sits above the video and clears the home-bar / notch via
 * the safe-area inset.
 *
 * A three-track grid, not a centered flex: the primary control lives in
 * the middle `auto` track and the equal `1fr` flanks hold it at the
 * viewport's optical center regardless of how wide the side controls'
 * labels grow — or whether a side control is mounted at all. A flex
 * would only center the *cluster*, letting an uneven pair drag the
 * middle button off-axis.
 */
export const controls = style({
  position: 'absolute',
  insetInline: 0,
  bottom: `calc(${space[6]} + env(safe-area-inset-bottom))`,
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  // Snug on a phone where the rail is cramped; loosens as the viewport
  // earns the room.
  columnGap: space[2],
  '@media': {
    [breakpoint.md]: { columnGap: space[5] },
  },
});

/** The primary control, held dead-center by the flanking tracks. */
export const centerControl = style({ gridColumn: 2 });

/**
 * The trailing side control (the torch). Sits in the right track, hugged
 * up against the center button rather than flung to the viewport edge.
 * The leading track stays free for the planned upload-from-photos
 * control, which will mirror this with `justifySelf: 'end'`.
 */
export const endControl = style({ gridColumn: 3, justifySelf: 'start' });
