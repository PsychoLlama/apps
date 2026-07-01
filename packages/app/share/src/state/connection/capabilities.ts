import init, { connect, type Connection } from '@crate/iroh';
import { createLogger, toError } from '@lib/observability';
import type { DeepReadonly } from '@lib/state';
import { loadSecretKey, saveSecretKey } from './key-store';
import type { ConnectionState } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Restore the saved endpoint key, or `undefined` if none is stored. A failed
 * read (e.g. IndexedDB blocked in private mode) is logged and swallowed:
 * persistence is a convenience, so we fall back to minting a fresh identity
 * rather than failing the connect outright.
 */
const restoreSecretKey = async (): Promise<Uint8Array | undefined> => {
  try {
    return await loadSecretKey();
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
    await saveSecretKey(secretKey);
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
 * Restores a saved secret key (falling back to a fresh one) so the endpoint
 * keeps a stable identity across reloads, then persists whichever key the
 * endpoint ended up with.
 *
 * `signal` lets the view cancel a connect it no longer needs. iroh's own
 * `connect()` isn't interruptible, so cancellation is cooperative: after each
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

  const secretKey = await restoreSecretKey();
  if (signal.aborted) return null;

  const endpoint = await connect(secretKey);
  if (signal.aborted) {
    endpoint.free();
    return null;
  }

  // Save the key the endpoint actually used — the restored one, or the fresh
  // one the wasm minted when nothing was stored — before handing it back.
  await persistSecretKey(endpoint.secretKey);
  if (signal.aborted) {
    endpoint.free();
    return null;
  }

  return endpoint;
};

/**
 * Free the held endpoint straight off the store view, tearing its relay
 * connection down. A no-op before one's been opened.
 */
export const closeConnection = (state: DeepReadonly<ConnectionState>): void => {
  state.endpoint?.current.free();
};
