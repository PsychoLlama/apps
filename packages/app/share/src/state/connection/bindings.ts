import { defineAction, defineEffect, ref } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import type { Connection } from '@crate/iroh';
import { closeConnection, openConnection } from './capabilities';
import { connectionStore } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Enter the connecting state as the wasm load + handshake get under way. */
const beginConnecting = defineAction([connectionStore], (state) => {
  state.status = 'connecting';
  state.endpoint = null;
});

/**
 * Land a live endpoint and mark the relay connection up. A `null` endpoint
 * means the connect was aborted mid-flight (the view went away) — leave the
 * store alone; the cleanup that triggered the abort resets it.
 */
const setConnected = defineAction(
  [connectionStore],
  (state, endpoint: Connection | null) => {
    if (!endpoint) return;
    state.status = 'connected';
    state.endpoint = ref(endpoint);
    logger.debug('Connected to iroh relay.', {
      endpointId: endpoint.endpointId,
      homeRelay: endpoint.homeRelay,
    });
  },
);

/**
 * Record a failed connect. Lands in `failed` — a terminal state the header
 * flags — rather than stranding the view in `connecting`. There's no reconnect
 * UI yet; teardown resets it back to `initial`.
 */
const failConnection = defineAction(
  [connectionStore],
  (state, error: Error) => {
    state.status = 'failed';
    state.endpoint = null;
    logger.error('Failed to join the iroh relay network.', {
      error: toError(error),
    });
  },
);

/** Forget the endpoint once it's been freed, returning to the initial state. */
const resetConnection = defineAction([connectionStore], (state) => {
  state.status = 'initial';
  state.endpoint = null;
});

/**
 * Instantiate the wasm and join the relay network, holding the resulting
 * endpoint in state. Client-only — the wasm and handshake can't run during
 * SSG — so perform it from `onMount`, passing an `AbortSignal` the cleanup
 * aborts. The endpoint it opens is held in state, so
 * {@link releaseConnectionEffect} must run on cleanup to free it.
 */
export const openConnectionEffect = defineEffect([], openConnection, {
  onStart: beginConnecting,
  onSuccess: setConnected,
  onFailure: failConnection,
});

/**
 * Free the held endpoint and forget it. Pairs with the mount-time open so a
 * view that's navigated away from doesn't leak its relay connection. The free
 * is the side effect; the action only drops the reference.
 */
export const releaseConnectionEffect = defineEffect(
  [connectionStore],
  closeConnection,
  { onSuccess: resetConnection },
);
