import init, { encode } from '@crate/qr-code';
import type { QrGrid } from './store';

/**
 * The wasm init promise, memoized so the module instantiates once and every
 * later encode reuses it — and so concurrent first calls collapse onto a
 * single fetch rather than racing two instantiations.
 */
let wasmReady: Promise<unknown> | undefined;

/**
 * Encode `text` into a QR module grid, instantiating the wasm on first use.
 * Copies `size`/`modules` out of the wasm handle into a plain {@link QrGrid}
 * and frees the handle, so the result owns its bytes and the reactive store
 * never touches wasm memory. Client-only — the wasm can't run during SSG.
 */
export const encodeQrCode = async (text: string): Promise<QrGrid> => {
  wasmReady ??= init();
  await wasmReady;

  const code = encode(text);
  const grid: QrGrid = { size: code.size, modules: code.modules };
  code.free();
  return grid;
};
