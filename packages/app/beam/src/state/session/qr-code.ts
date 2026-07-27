import { defineCell, defineFold, defineTopic } from '@lib/state-next';
import { beamScope } from './scope';

/**
 * A generated QR code as its raw module grid — no pixels, just which cells
 * are dark — so the view paints it with its own tokens. A plain copy of the
 * shape `@crate/qr-code` returns, lifted out of wasm memory so it outlives
 * the handle.
 */
export interface QrGrid {
  /** Modules per side, quiet zone included. The grid is `size × size`. */
  size: number;
  /** Row-major grid, one byte per module: 1 = dark, 0 = light. */
  modules: Uint8Array;
}

/**
 * The QR rendering of this session's beam link. A cell, not store state —
 * the grid is a byte buffer a reactive store must never proxy. `null` until
 * the encode lands (both the encoder and the link are client-only), and if
 * the encode failed.
 */
export const qrCodeCell = defineCell<QrGrid | null>(beamScope, () => null);

/**
 * The beam link was encoded into a scannable grid, or `null` if the encode
 * failed. Failure is non-fatal — the link is still copyable from its text
 * field — so this rides the same transition as the connection coming up
 * rather than a separate one.
 */
export const codeEncodedTopic = defineTopic<QrGrid | null>();
defineFold(codeEncodedTopic, [qrCodeCell], (code, grid) => {
  code.current = grid;
});
