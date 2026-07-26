import init, { generateSecretKey, joinRelay, type Relay } from '@crate/iroh';
import initQrCode, { encode } from '@crate/qr-code';
import { createLogger, toError } from '@lib/observability';
import { read, write, type VaultId } from '@lib/vault';
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
 * can't run during prerender.
 *
 * Reuses a saved identity, or mints a fresh one so the endpoint keeps a stable
 * identity (and beam link) across reloads. A fresh key is persisted in
 * parallel with the relay connect rather than before it — the connect is the
 * slow, networked step, and the write needn't gate it.
 *
 * Cancellation is cooperative: iroh's own `joinRelay()` isn't interruptible,
 * so after each `await` we bail on the signal, freeing a late-arriving relay
 * so its connection doesn't linger.
 */
export const openConnection = async (signal: AbortSignal): Promise<Relay> => {
  try {
    await init();
    signal.throwIfAborted();
    logger.debug('Iroh wasm initialized.');

    const restored = await restoreSecretKey();
    signal.throwIfAborted();

    // Reuse the saved identity, or mint one and persist it alongside the
    // connect.
    const secretKey = restored ?? generateSecretKey();
    const persisting = restored ? undefined : persistSecretKey(secretKey);

    const relay = await joinRelay(secretKey);
    await persisting;

    // The handshake can't be interrupted, so a relay that lands after the
    // abort has to be freed here or its relay connection lingers.
    if (signal.aborted) relay.free();
    signal.throwIfAborted();

    // Start serving inbound dials so the peer being dialed logs the other
    // side of the connection. The loop is held by the relay and torn down
    // when it's freed. We only observe the peer's id, then free our handle —
    // the accept loop keeps its own, so the connection stays open.
    relay.acceptPeers((peer) => {
      logger.debug('Peer connected.', { endpointId: peer.remoteId });
      peer.free();
    });

    logger.debug('Connected to iroh relay.', {
      endpointId: relay.endpointId,
      homeRelay: relay.homeRelay,
    });

    return relay;
  } catch (error) {
    // An abort is ordinary teardown — the scope was released mid-connect —
    // so it isn't worth reporting as a failure.
    if (!signal.aborted) {
      logger.error('Failed to join the iroh relay network.', {
        error: toError(error),
      });
    }

    throw error;
  }
};

/**
 * Dial the peer named in a beam link over the live relay connection,
 * resolving once the connection is established.
 *
 * Logs the outcome here rather than from the saga, so it sits alongside
 * {@link openConnection}'s inbound `Peer connected.` log — both halves of a
 * peer connection are observed from this layer. A failed dial is reported and
 * swallowed; there's no retry affordance yet.
 *
 * The signal goes unused: iroh's `dial()` isn't interruptible, and the peer
 * handle is released before this resolves, so there's nothing an abort could
 * unwind.
 */
export const dialEndpoint = async (
  _signal: AbortSignal,
  relay: Relay,
  endpointId: string,
): Promise<void> => {
  try {
    const peer = await relay.dial(endpointId);
    logger.debug('Dialed peer.', { endpointId: peer.remoteId });
    peer.free();
  } catch (error) {
    logger.error('Failed to dial peer.', {
      endpointId,
      error: toError(error),
    });
  }
};

/**
 * The beam link to an endpoint — the `/beam/share/:id` URL a peer opens to
 * dial us, keyed by the endpoint's public identity. Only ever built
 * client-side (the endpoint is `null` until the client-only connect lands), so
 * `window.location.origin` is safe to read.
 */
export const beamLink = (endpointId: string): string =>
  new URL(`/beam/share/${endpointId}`, window.location.origin).href;

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
