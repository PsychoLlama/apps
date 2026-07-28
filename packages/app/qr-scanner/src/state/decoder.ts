import { defineCell, defineFold, defineTopic } from '@lib/state-next';
import { terminateDecoder, type DecoderConnection } from '../decoder';
import { scannerScope } from './scope';

/**
 * The decoder worker and its RPC binding once spawned and the wasm module is
 * live, else `null`. A cell, not store state — a reactive store must never
 * proxy the host {@link Worker} or its RPC.
 *
 * Kept apart from the camera session it serves: the worker is preloaded once
 * on page mount and outlives individual camera sessions, so a session's
 * start/stop churn never touches it. Dropping the cell closes the RPC and
 * reclaims the thread, so no worker outlives the page that spawned it.
 */
export const decoderCell = defineCell<DecoderConnection | null>(
  scannerScope,
  () => null,
  { drop: terminateDecoder },
);

/** The decoder worker spawned and its wasm module is live. */
export const decoderReadyTopic = defineTopic<DecoderConnection>();
defineFold(decoderReadyTopic, [decoderCell], (held, connection) => {
  held.current = connection;
});
