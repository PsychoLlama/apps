import { style } from '@vanilla-extract/css';

/**
 * The beam link field, sharing its row with the QR code. Grows to eat the
 * row's free width while keeping its natural control height — the row's
 * `start` alignment leaves it at the top rather than stretching it to the
 * code's height.
 */
export const field = style({
  flexGrow: 1,
});
