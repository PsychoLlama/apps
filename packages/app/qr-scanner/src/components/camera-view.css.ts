import { style } from '@vanilla-extract/css';
import { black, space } from '@lib/design';

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
