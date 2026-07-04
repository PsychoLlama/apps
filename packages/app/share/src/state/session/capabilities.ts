import type { DeepReadonly } from '@lib/state';
import { closeConnection, dialPeer as dialConnection } from '@lib/iroh';
import init, { encode } from '@crate/qr-code';
import type { ConnectionState } from './connection';
import type { QrGrid } from './qr-code';

/**
 * Free the endpoint held in the store, tearing its relay connection down.
 * Adapts `@lib/iroh`'s connection-level {@link closeConnection} to the store
 * shape the effect binds — a no-op before a connection's been opened.
 */
export const releaseConnection = (
  state: DeepReadonly<ConnectionState>,
): void => {
  closeConnection(state.endpoint?.current);
};

/**
 * Dial the peer named in a share link over the store's live endpoint. The
 * caller only dials once the connection is `connected`, so a missing endpoint
 * is a caller bug and throws. The dial itself — and its logging — lives in
 * `@lib/iroh`; this only pulls the endpoint off the store.
 */
export const dialPeer = (
  state: DeepReadonly<ConnectionState>,
  endpointId: string,
): Promise<void> => {
  const endpoint = state.endpoint?.current;
  if (!endpoint) {
    throw new Error('Cannot dial a peer before the relay connection is up.');
  }
  return dialConnection(endpoint, endpointId);
};

/**
 * The shareable link to an endpoint — the `/share/with/:endpoint` URL a peer
 * opens to dial us, keyed by the endpoint's public identity. Only ever built
 * client-side (the endpoint is `null` until the client-only connect lands), so
 * `window.location.origin` is safe to read.
 */
export const shareLink = (endpointId: string): string =>
  new URL(`/share/with/${endpointId}`, window.location.origin).href;

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
