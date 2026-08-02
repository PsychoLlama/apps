import { defineCell, defineFold, defineTopic } from '@lib/state';
import { beamScope } from '../scope';
import type { QrGrid } from '../platform/qr-code';

/**
 * The QR rendering of this device's beam link. A cell, not store state —
 * the grid is a byte buffer a reactive store must never proxy. `null` until
 * the encode lands (both the encoder and the link are client-only), and if
 * the encode failed.
 */
export const qrCodeCell = defineCell<QrGrid | null>(beamScope, () => null);

/**
 * The beam link was encoded into a scannable grid, or `null` if the encode
 * failed. Failure is non-fatal — the link is still copyable from its text
 * field — so this is published either way rather than left absent.
 *
 * Its own transition, landing whenever the encoder gets there. The link it
 * encodes is settled the moment this device's identity is, so the invite is
 * already usable and the code is the part that catches up.
 */
export const codeEncodedTopic = defineTopic<QrGrid | null>();
defineFold(codeEncodedTopic, [qrCodeCell], (code, grid) => {
  code.current = grid;
});
