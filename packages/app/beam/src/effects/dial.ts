import { assert } from '@lib/assert';
import { collect } from '@lib/effects';
import { createLogger } from '@lib/observability';
import type { PeerLink } from '../platform/iroh';
import {
  $contacts,
  $identity,
  $peerDialing,
  $peerLinks,
  $peerUnreachable,
  isEndpointId,
} from '../state';
import { $connect } from './connect';
import { $recordPeer } from './contacts';
import { $linkPeer } from './link';
import { $finishPairing } from './onboarding';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Dial the peer named in a beam link, recording it in the address book first
 * so the contact survives the reload the dial might not. The caller only
 * dials once the connection is `connected`, so a missing session is a caller
 * bug and throws.
 *
 * An id that isn't an address is dropped before any of that: `/share/bacon`
 * is a URL anybody can type, and without this it leaves a contact behind
 * forever. Opening your own beam link is a no-op — it's what happens when you
 * scan the code off your own screen. A peer already dialled or linked this
 * session is left alone, since returning to the share view re-runs this.
 */
export const $dialPeer = collect(
  [
    $connect,
    $identity,
    $peerLinks,
    $contacts,
    $recordPeer,
    $finishPairing,
    $peerDialing,
    $peerUnreachable,
    $linkPeer,
  ],
  (
    session,
    self,
    links,
    book,
    recordPeer,
    finishPairing,
    peerDialing,
    peerUnreachable,
    linkPeer,
  ) =>
    async (endpointId: string) => {
      if (!isEndpointId(endpointId)) return;
      assert(session, 'Cannot dial a peer before the relay connection is up.');

      // Answered off the identity: the session is open before the key is
      // settled, so it has no address of its own to compare against.
      if (endpointId === self.endpointId) return;

      const status = links.statuses[endpointId];
      if (status === 'dialing' || status === 'linked') return;

      const known = endpointId in book.entries;
      await recordPeer(endpointId);

      // We found somebody, which answers setup's last step just as well as
      // being found does. Before the dial, like the contact: a peer that
      // turns out to be asleep is still a peer this device has met.
      await finishPairing();

      logger.info(
        known ? 'Reconnecting to a known device.' : 'Reaching a new device.',
        { endpointId, known },
      );

      peerDialing(endpointId);

      let peer: PeerLink;
      try {
        peer = await session.p2p.dial(endpointId);
      } catch {
        // An asleep or absent device is an ordinary outcome, not a failure.
        peerUnreachable(endpointId);
        return;
      }

      await linkPeer(peer, session.signal);
    },
);
