import { collect, resource } from '@lib/effects';
import { createLogger, toError } from '@lib/observability';
import { loadIdentity, startP2p, type P2pSession } from '../platform/iroh';
import { encodeBeamCode } from '../platform/qr-code';
import {
  $codeEncoded,
  $connected,
  $connectFailed,
  $identityResolved,
  $relayChanged,
} from '../state';
import { inBackground } from './background';
import { $greetPeer } from './link';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * A live visit to the relay network: the worker's session, and the signal
 * that ends everything running against it.
 */
export interface Session {
  /** The session on the p2p worker. */
  readonly p2p: P2pSession;

  /** Aborts when the session is released, ending its loops. */
  readonly signal: AbortSignal;
}

/**
 * Settle this device's identity, then join the relay network under it, for as
 * long as the plan is held. Yields the session, or `null` if coming up
 * failed — which lands as `failed` on `$connection` rather than at the error
 * boundary, since there's no reconnect and the rest of the app still works.
 *
 * Published in two steps because they finish at very different times. The
 * identity is a key derivation, so the header can name this device and the
 * invite can show its link while the handshake is still a round trip away.
 * The QR encode starts off the identity and lands whenever it lands.
 *
 * Once joined, inbound dials are served and relay changes reported until the
 * session ends. Releasing it aborts those loops and tells the worker to
 * leave, which closes every peer link with it. A release mid-handshake waits
 * the handshake out first; iroh's join can't be interrupted.
 *
 * Client-only, so the layout holds it from mount.
 */
export const $connect = collect(
  [
    $identityResolved,
    $codeEncoded,
    $connected,
    $relayChanged,
    $connectFailed,
    $greetPeer,
  ],
  async (
    identityResolved,
    codeEncoded,
    connected,
    relayChanged,
    connectFailed,
    greetPeer,
  ) => {
    const controller = new AbortController();
    const { signal } = controller;
    let p2p: P2pSession | undefined;

    const release = () => {
      controller.abort();
      p2p?.release();
    };

    try {
      const session = await startP2p();
      p2p = session;

      const self = await loadIdentity(session);
      identityResolved(self.endpointId);

      void encodeBeamCode(self.endpointId).then((grid) => {
        if (!signal.aborted) codeEncoded(grid);
      });

      await session.join();
      connected();

      inBackground(signal, async () => {
        while (true) {
          const peer = await session.peers.next(signal);

          // Each peer on its own, so a slow greeting doesn't hold up the
          // next arrival.
          inBackground(signal, () => greetPeer(peer, signal));
        }
      });

      inBackground(signal, async () => {
        while (true) relayChanged(await session.relay.next(signal));
      });

      return resource<Session | null, void>({ p2p: session, signal }, release);
    } catch (error) {
      logger.error('Could not join the relay network.', {
        error: toError(error),
      });

      connectFailed();
      return resource<Session | null, void>(null, release);
    }
  },
);
