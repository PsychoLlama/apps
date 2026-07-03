import init, {
  generateSecretKey,
  joinRelay,
  type Connection,
} from '@crate/iroh';
import { createLogger, toError } from '@lib/observability';
import { read, write, type VaultId } from '@lib/vault';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Vault id the endpoint's secret key is persisted under, namespaced per the
 * vault's id convention. The key is the private half of the endpoint's
 * identity — and thus its share link — so it goes through `@lib/vault`, which
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
 * Persist the endpoint's key so its identity — and share link — survives a
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
 * identity (and share link) across reloads. A fresh key is persisted in
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

  // Start serving inbound dials so the peer being shared-with logs the other
  // side of the connection. The loop is held by the endpoint and torn down
  // when it's freed.
  endpoint.acceptPeers((endpointId) => {
    logger.debug('Peer connected.', { endpointId });
  });

  return endpoint;
};

/**
 * Dial another endpoint by its id over a live connection, resolving once the
 * peer connection is established. The caller supplies the connection returned
 * by {@link openConnection}.
 *
 * Logs the outcome here (rather than leaving it to the caller) to sit
 * alongside {@link openConnection}'s inbound `Peer connected.` log — both
 * halves of a peer connection are observed from this layer.
 */
export const dialPeer = async (
  connection: Connection,
  endpointId: string,
): Promise<void> => {
  try {
    const peer = await connection.dial(endpointId);
    logger.debug('Dialed peer.', { endpointId: peer });
  } catch (error) {
    logger.error('Failed to dial peer.', {
      endpointId,
      error: toError(error),
    });
  }
};

/**
 * Free a connection, tearing its relay membership down. Tolerates `null` /
 * `undefined` so callers can release whatever they're holding without a guard
 * — a no-op before one's been opened.
 */
export const closeConnection = (
  connection: Connection | null | undefined,
): void => {
  connection?.free();
};
