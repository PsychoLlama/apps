import { style } from '@vanilla-extract/css';

/**
 * The share link field, sitting left of the QR code. Grows to eat the row's
 * free width and — via the row's `stretch` — matches the code's height. A
 * zeroed `min-width` lets it shrink past the long URL so the link scrolls
 * inside the input instead of shoving the code off-screen.
 */
export const field = style({
  flexGrow: 1,
  minWidth: 0,
  // The field pins itself to a fixed control height; drop that so the row's
  // `stretch` grows it to the QR code's height beside it.
  height: 'auto',
});
