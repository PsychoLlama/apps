import initQrCode, { encode } from '@crate/qr-code';
import { createLogger, toError } from '@lib/observability';
import { beamLink } from '../endpoint';

/**
 * Turning this device's beam link into something a camera can read.
 *
 * Its own module rather than part of the endpoint's: it's a second wasm
 * bundle with a second instantiation, it touches no network, and it finishes
 * on its own schedule — the invite is usable from the link's text long before
 * the code is drawn.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

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
 * The wasm init promise, memoized so the module instantiates once and every
 * later encode reuses it — and so concurrent first calls collapse onto a
 * single fetch rather than racing two instantiations.
 */
let wasmReady: Promise<unknown> | undefined;

/**
 * Encode this endpoint's beam link into a QR module grid, instantiating the
 * encoder wasm on first use. Copies `size`/`modules` out of the wasm handle
 * into a plain {@link QrGrid} and frees the handle, so the result owns its
 * bytes and nothing downstream touches wasm memory. Client-only — neither the
 * wasm nor `window.location` is available during SSG.
 *
 * Never rejects. A failed encode is non-fatal — the link is still copyable
 * from its text field — so it resolves to `null` rather than sinking the
 * connection landing alongside it.
 */
export const encodeBeamCode = async (
  signal: AbortSignal,
  endpointId: string,
): Promise<QrGrid | null> => {
  try {
    wasmReady ??= initQrCode();
    await wasmReady;
    signal.throwIfAborted();

    const code = encode(beamLink(endpointId));
    const grid: QrGrid = { size: code.size, modules: code.modules };
    code.free();
    return grid;
  } catch (error) {
    if (!signal.aborted) {
      logger.error('Failed to encode the beam link as a QR code.', {
        error: toError(error),
      });
    }

    return null;
  }
};
