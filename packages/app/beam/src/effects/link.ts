import { collect } from '@lib/effects';
import { createLogger } from '@lib/observability';
import { sendMessage, type PeerLink } from '../platform/iroh';
import { helloMessage } from '../protocol';
import {
  $contacts,
  $identity,
  $peerClosed,
  $peerHandles,
  $peerLinked,
  $peerReleased,
  deviceNameOf,
} from '../state';
import { inBackground } from './background';
import { $recordPeer } from './contacts';
import { $applyPeerMessage } from './messages';
import { $finishPairing } from './onboarding';
import { $flushShares } from './shares';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Take a freshly established link into the session, in either direction:
 * hold the handle, start listening, introduce ourselves, and send whatever
 * was queued while the peer was away. `signal` is the session's, so the
 * listeners end with it.
 *
 * Every link gets a close watch, because either end can hang up: walking away
 * from a share view closes the connection from that side, and this is how the
 * device left holding it finds out. Deliberate teardown settles the same
 * promise; `$peerClosed` sorts that out by handle.
 */
export const $linkPeer = collect(
  [
    $peerHandles,
    $peerLinked,
    $peerClosed,
    $identity,
    $applyPeerMessage,
    $flushShares,
  ],
  (handles, peerLinked, peerClosed, self, applyPeerMessage, flushShares) =>
    async (peer: PeerLink, signal: AbortSignal) => {
      // A second link to the same peer replaces the first. Leaving the old
      // one would strand it open for the life of the session.
      handles().get(peer.endpointId)?.release();
      peerLinked(peer);

      inBackground(signal, async () => {
        while (true) {
          const message = await peer.messages.next(signal);
          await applyPeerMessage(peer.endpointId, message);
        }
      });

      void peer.closed.then(() => {
        if (signal.aborted) return;
        logger.debug('A peer link closed.', { endpointId: peer.endpointId });
        peerClosed(peer);
      });

      const label = deviceNameOf(self);
      if (label) await sendMessage(peer, helloMessage(label));

      await flushShares(peer);
    },
);

/** Take an inbound dial: file the peer in the address book, then link it. */
export const $greetPeer = collect(
  [$contacts, $recordPeer, $finishPairing, $linkPeer],
  (book, recordPeer, finishPairing, linkPeer) =>
    async (peer: PeerLink, signal: AbortSignal) => {
      // Checked before the sighting files it, so a device turning up for the
      // first time reads as new.
      const known = peer.endpointId in book.entries;

      await recordPeer(peer.endpointId);

      // Somebody found us, which is the whole of what setup's last step asks
      // for. A no-op once it's been answered.
      await finishPairing();

      logger.info(
        known ? 'A known device connected.' : 'A new device connected.',
        { endpointId: peer.endpointId, known },
      );

      await linkPeer(peer, signal);
    },
);

/**
 * Hang up on a peer, leaving the contact alone. This is what leaving a share
 * view does: a connection holds a relay stream open on both ends and keeps
 * the other device listed as reachable, and the share view is the only place
 * either matters. Closing it tells the peer plainly.
 *
 * Nothing is lost by it: the contact stays, anything unsent stays queued, and
 * coming back re-dials and flushes. A no-op for a peer with no live link.
 */
export const $disconnectPeer = collect(
  [$peerHandles, $peerReleased],
  (handles, peerReleased) => (endpointId: string) => {
    const link = handles().get(endpointId);
    if (!link) return;

    link.release();
    peerReleased(endpointId);
  },
);
