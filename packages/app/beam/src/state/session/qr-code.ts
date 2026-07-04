import { createStore, defineStore, type Ref } from '@lib/state';

/**
 * A generated QR code as its raw module grid — no pixels, just which cells
 * are dark — so the view paints it with its own tokens. A plain copy of the
 * shape `@crate/qr-code` returns, lifted out of wasm memory so it outlives the
 * handle and the reactive store never proxies wasm-owned bytes.
 */
export interface QrGrid {
  /** Modules per side, quiet zone included. The grid is `size × size`. */
  size: number;
  /** Row-major grid, one byte per module: 1 = dark, 0 = light. */
  modules: Uint8Array;
}

/** The QR rendering of the current beam link. */
export interface QrCodeState {
  /**
   * The encoded grid for the live beam link, held behind `Ref` so the
   * reactive store doesn't proxy the byte buffer. `null` until the first
   * encode lands — the wasm encoder and the link are both client-only — and
   * again if an encode fails.
   */
  grid: Ref<QrGrid> | null;
}

export const qrCodeStore = defineStore<QrCodeState>(() => ({
  grid: null,
}));

/** Live, readonly view of the beam link's QR grid. */
export const qrCode = createStore(qrCodeStore);
