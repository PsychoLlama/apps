import init, { connect, type Connection } from '@crate/iroh';
import { createLogger } from '@lib/observability';
import type { DeepReadonly } from '@lib/state';
import type { ConnectionState } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Instantiate the iroh wasm module and join the public relay network. Both
 * steps are async and client-only — the wasm fetches and the relay handshake
 * can't run during prerender — so this is driven from `onMount`.
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

  const endpoint = await connect();
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
