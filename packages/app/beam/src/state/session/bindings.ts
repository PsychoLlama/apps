import { defineAction, defineEffect, ref } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import type { Relay } from '@crate/iroh';
import {
  closeConnection,
  dialPeer,
  encodeQrCode,
  openConnection,
  beamLink,
} from './capabilities';
import { connectionStore } from './connection';
import { qrCodeStore, type QrGrid } from './qr-code';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * A live relay paired with the QR encoding of its beam link — the two
 * halves of a beam session, landed together so the view never shows a
 * connection without its code (nor a stale code without its connection). The
 * grid is `null` when the encode failed, which is non-fatal: the link is still
 * copyable from its text field.
 */
interface BeamSession {
  relay: Relay;
  qrCode: QrGrid | null;
}

/**
 * Enter the connecting state as the wasm load + handshake get under way,
 * dropping any QR grid from a prior session so it can't outlive its relay.
 */
const beginConnecting = defineAction(
  [connectionStore, qrCodeStore],
  (connection, qr) => {
    connection.status = 'connecting';
    connection.relay = null;
    qr.grid = null;
  },
);

/**
 * Land a live endpoint and its beam-link QR, marking the relay connection up.
 * A `null` session means the connect was aborted mid-flight (the view went
 * away) — leave the stores alone; the cleanup that triggered the abort resets
 * them.
 */
const setConnected = defineAction(
  [connectionStore, qrCodeStore],
  (connection, qr, session: BeamSession | null) => {
    if (!session) return;
    connection.status = 'connected';
    connection.relay = ref(session.relay);
    qr.grid = session.qrCode ? ref(session.qrCode) : null;
    logger.debug('Connected to iroh relay.', {
      endpointId: session.relay.endpointId,
      homeRelay: session.relay.homeRelay,
    });
  },
);

/**
 * Record a failed connect. Lands in `failed` — a terminal state the header
 * flags — rather than stranding the view in `connecting`. There's no reconnect
 * UI yet; teardown resets it back to `initial`.
 */
const failConnection = defineAction(
  [connectionStore, qrCodeStore],
  (connection, qr, error: Error) => {
    connection.status = 'failed';
    connection.relay = null;
    qr.grid = null;
    logger.error('Failed to join the iroh relay network.', {
      error: toError(error),
    });
  },
);

/** Forget the relay once it's been freed, returning to the initial state. */
const resetConnection = defineAction(
  [connectionStore, qrCodeStore],
  (connection, qr) => {
    connection.status = 'initial';
    connection.relay = null;
    qr.grid = null;
  },
);

/**
 * Join the relay network and encode the endpoint's beam link into a QR grid
 * as one client-only flow, so the relay and its code land in a single
 * transactional update. A `null` relay means the connect was aborted, and
 * short-circuits before the encode. The encode is non-fatal — a failed code
 * still leaves a copyable link — so it's caught here rather than failing the
 * whole connect.
 */
const openBeamSession = async (
  signal: AbortSignal,
): Promise<BeamSession | null> => {
  const relay = await openConnection(signal);
  if (!relay) return null;

  let qrCode: QrGrid | null = null;
  try {
    qrCode = await encodeQrCode(beamLink(relay.endpointId));
  } catch (error) {
    logger.error('Failed to encode the beam link as a QR code.', {
      error: toError(error),
    });
  }

  return { relay, qrCode };
};

/**
 * Instantiate the wasm, join the relay network, and encode the beam link,
 * holding the resulting relay and QR grid in state. Client-only — none of
 * it can run during SSG — so perform it from `onMount`, passing an
 * `AbortSignal` the cleanup aborts. The relay it opens is held in state, so
 * {@link releaseConnectionEffect} must run on cleanup to free it.
 */
export const openConnectionEffect = defineEffect([], openBeamSession, {
  onStart: beginConnecting,
  onSuccess: setConnected,
  onFailure: failConnection,
});

/**
 * Free the held relay and forget it. Pairs with the mount-time open so a
 * view that's navigated away from doesn't leak its relay connection. The free
 * is the side effect; the action only drops the reference.
 */
export const releaseConnectionEffect = defineEffect(
  [connectionStore],
  closeConnection,
  { onSuccess: resetConnection },
);

/**
 * Dial the peer named in a beam link once the relay connection is up. The
 * receiving view performs this with the endpoint id from its URL. Reads the
 * live relay off the store — the caller only dials once the connection is
 * `connected`, so a missing relay is a caller bug and throws. The dial's
 * success and failure are logged by {@link dialPeer} itself, so there are no
 * lifecycle actions here.
 */
export const dialPeerEffect = defineEffect([connectionStore], dialPeer);
