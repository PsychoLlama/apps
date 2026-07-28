import { AbortError, call, commit, defineSaga, read } from '@lib/state-next';
import { createLogger, toError } from '@lib/observability';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  relayCell,
} from './connection';
import { codeEncodedTopic } from './qr-code';
import { dialEndpoint, encodeBeamCode, openConnection } from './capabilities';
import { recordPeerSaga } from '../contacts';
import { beamScope } from '../scope';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Build a `catch` handler for a saga run. The sagas here commit their own
 * failures, so the rejection left over is the abort from a released anchor —
 * ordinary teardown, and nothing to report. Anything else is a bug, and
 * surfacing it beats letting it land as an unhandled rejection.
 */
export const reportSagaFailure =
  (message: string) =>
  (error: unknown): void => {
    if (error instanceof AbortError) return;
    logger.error(message, { error: toError(error) });
  };

/**
 * Join the relay network and encode this endpoint's beam link, landing the
 * live relay and its QR grid in a single transition so the view never shows a
 * connection without its code (nor a stale code without its connection).
 *
 * Client-only — neither the wasm fetch nor the handshake can run during SSG —
 * so `BeamLayout` starts it from `onMount`. Cancellation rides the scope's
 * signal: releasing the last anchor aborts the connect and frees whatever
 * relay it landed.
 *
 * Guarded on `initial` so a second anchor can't open a second relay, which
 * the cell would silently drop unfreed.
 */
export const connectRelaySaga = defineSaga(beamScope, async function* () {
  const { status } = yield* read(connectionStore);
  if (status !== 'initial') return;

  yield commit(connectingTopic());

  try {
    const endpoint = yield* call(openConnection);
    const grid = yield* call(encodeBeamCode, endpoint.endpointId);
    yield commit(connectedTopic(endpoint), codeEncodedTopic(grid));
  } catch {
    // Reported by the capability, which has the context to describe it.
    yield commit(connectFailedTopic());
  }
});

/**
 * Dial the peer named in a beam link over the relay connection the layout
 * holds open, recording it in the address book first so the pairing survives
 * the reload the dial might not. The caller only dials once the connection is
 * `connected`, so a missing relay is a caller bug and throws.
 *
 * Opening your own beam link is a no-op rather than an error — it's what
 * happens when you scan the code off your own screen, and dialling yourself
 * would both fail and leave a contact for this very device in the book.
 */
export const dialPeerSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    const endpoint = yield* read(relayCell);
    if (!endpoint) {
      throw new Error('Cannot dial a peer before the relay connection is up.');
    }

    if (endpointId === endpoint.endpointId) return;

    yield* recordPeerSaga({ endpointId, direction: 'outbound' });
    yield* call(dialEndpoint, endpoint, endpointId);
  },
);
