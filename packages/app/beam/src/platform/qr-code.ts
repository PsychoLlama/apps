import initQrCode, { encode } from '@crate/qr-code';
import { createLogger, toError } from '@lib/observability';
import type { QrGrid } from '../state';

/**
 * Turning a link into something a camera can read.
 *
 * Its own module rather than part of the device's: it's a second wasm
 * bundle with a second instantiation, on the page rather than in the
 * worker, and only ever needed when an invitation is shown.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * The wasm init promise, memoized so the module instantiates once and
 * concurrent first calls collapse onto a single fetch.
 */
let wasmReady: Promise<unknown> | undefined;

/**
 * Encode `text` into a QR module grid, instantiating the encoder wasm on
 * first use. Copies the grid out of the wasm handle and frees it, so the
 * result owns its bytes.
 *
 * Never rejects. A failed encode is non-fatal, since the link is still
 * there to copy, so it resolves to `null`.
 */
export const encodeQr = async (text: string): Promise<QrGrid | null> => {
  try {
    wasmReady ??= initQrCode();
    await wasmReady;

    const code = encode(text);
    const grid: QrGrid = { size: code.size, modules: code.modules };
    code.free();
    return grid;
  } catch (error) {
    logger.error('Failed to encode a QR code.', { error: toError(error) });
    return null;
  }
};
