import init, {
  generateSecretKey,
  joinRelay,
  type Connection,
} from '@crate/iroh';
import initQrCode, { encode } from '@crate/qr-code';
import { createLogger, toError } from '@lib/observability';
import type { DeepReadonly } from '@lib/state';
import { read, write, type VaultId } from '@lib/vault';
import type { ConnectionState } from './connection';
import type { QrGrid } from './qr-code';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Vault id the endpoint's secret key is persisted under, namespaced per the
 * vault's id convention. The key is the private half of the endpoint's
 * identity — and thus its beam link — so it goes through `@lib/vault`, which
 * encrypts it at rest under a non-extractable AES-GCM key rather than leaving
 * the raw bytes on disk in the clear.
 */
const SECRET_KEY_ID: VaultId = 'iroh/secret-key';

/**
 * Restore the saved endpoint key, or `undefined` if none is stored. A failed
 * read (e.g. IndexedDB blocked in private mode, or a cleared encryption key) is
 * logged and swallowed: persistence is a convenience, so we fall back to
 * minting a fresh identity rather than failing the connect outright.
 */
const restoreSecretKey = async (): Promise<Uint8Array | undefined> => {
  try {
    const stored = await read(SECRET_KEY_ID);
    return stored ? new Uint8Array(stored) : undefined;
  } catch (error) {
    logger.warn('Could not read the saved endpoint key; minting a fresh one.', {
      error: toError(error),
    });
    return undefined;
  }
};

/**
 * Persist the endpoint's key so its identity — and beam link — survives a
 * reload. Best-effort for the same reason as {@link restoreSecretKey}: a
 * failed write only means the identity may change next time, not that this
 * connection is unusable.
 */
const persistSecretKey = async (secretKey: Uint8Array): Promise<void> => {
  try {
    await write(SECRET_KEY_ID, secretKey);
  } catch (error) {
    logger.warn('Could not persist the endpoint key; identity may change.', {
      error: toError(error),
    });
  }
};

/**
 * Instantiate the iroh wasm module and join the public relay network. Both
 * steps are async and client-only — the wasm fetches and the relay handshake
 * can't run during prerender — so this is driven from `onMount`.
 *
 * Reuses a saved identity, or mints a fresh one so the endpoint keeps a stable
 * identity (and beam link) across reloads. A fresh key is persisted in
 * parallel with the relay connect rather than before it — the connect is the
 * slow, networked step, and the write needn't gate it.
 *
 * `signal` lets the view cancel a connect it no longer needs. iroh's own
 * `joinRelay()` isn't interruptible, so cancellation is cooperative: after each
 * `await` we bail if the signal has fired, freeing a late-arriving endpoint so
 * its relay connection doesn't linger, and resolve to `null` rather than
 * handing back an endpoint nothing will hold.
 */
export const openConnection = async (
  signal: AbortSignal,
): Promise<Connection | null> => {
  await init();
  if (signal.aborted) return null;
  logger.debug('Iroh wasm initialized.');

  const restored = await restoreSecretKey();
  if (signal.aborted) return null;

  // Reuse the saved identity, or mint one and persist it alongside the connect.
  const secretKey = restored ?? generateSecretKey();
  const persisting = restored ? undefined : persistSecretKey(secretKey);

  const endpoint = await joinRelay(secretKey);
  await persisting;
  if (signal.aborted) {
    endpoint.free();
    return null;
  }

  // Start serving inbound dials so the peer being dialed logs the other
  // side of the connection. The loop is held by the endpoint and torn down
  // when it's freed.
  endpoint.acceptPeers((endpointId) => {
    logger.debug('Peer connected.', { endpointId });
  });

  return endpoint;
};

/**
 * Dial the peer named in a beam link over the live relay connection,
 * resolving once the connection is established. Reads the endpoint off the
 * connection store — the caller only dials once the relay connection is
 * `connected`, so a missing endpoint is a caller bug and throws.
 *
 * Logs the outcome here (rather than via effect lifecycle actions) to sit
 * alongside {@link openConnection}'s inbound `Peer connected.` log — both
 * halves of a peer connection are observed from this layer.
 */
export const dialPeer = async (
  state: DeepReadonly<ConnectionState>,
  endpointId: string,
): Promise<void> => {
  const endpoint = state.endpoint?.current;
  if (!endpoint) {
    throw new Error('Cannot dial a peer before the relay connection is up.');
  }

  try {
    const peer = await endpoint.dial(endpointId);
    logger.debug('Dialed peer.', { endpointId: peer });
  } catch (error) {
    logger.error('Failed to dial peer.', {
      endpointId,
      error: toError(error),
    });
  }
};

/**
 * Free the held endpoint straight off the store view, tearing its relay
 * connection down. A no-op before one's been opened.
 */
export const closeConnection = (state: DeepReadonly<ConnectionState>): void => {
  state.endpoint?.current.free();
};

/**
 * The beam link to an endpoint — the `/beam/with/:endpoint` URL a peer
 * opens to dial us, keyed by the endpoint's public identity. Only ever built
 * client-side (the endpoint is `null` until the client-only connect lands), so
 * `window.location.origin` is safe to read.
 */
export const beamLink = (endpointId: string): string =>
  new URL(`/beam/with/${endpointId}`, window.location.origin).href;

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
  wasmReady ??= initQrCode();
  await wasmReady;

  const code = encode(text);
  const grid: QrGrid = { size: code.size, modules: code.modules };
  code.free();
  return grid;
};
