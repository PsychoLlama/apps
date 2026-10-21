import { collect } from '@lib/effects';
import { sendMessage, type PeerLink } from '../platform/iroh';
import { shareMessage } from '../protocol';
import {
  $peerHandles,
  $shareLog,
  $shareQueued,
  $shareReceived,
  $shareSent,
  normalizeShare,
} from '../state';

/**
 * Hand everything queued for a peer to the transport, in the order it was
 * written. Run wherever a queue might have become sendable: a link coming up,
 * or a share written while one is.
 *
 * Stops at the first send that doesn't land. The link is gone, and marching
 * through the rest against a dead connection would report a pile of shares
 * as sent that nobody received.
 */
export const $flushShares = collect(
  [$shareLog, $shareSent],
  (log, shareSent) => async (peer: PeerLink) => {
    const queued = log.items.filter(
      (share) =>
        share.endpointId === peer.endpointId && share.status === 'queued',
    );

    for (const share of queued) {
      if (!(await sendMessage(peer, shareMessage(share.body)))) break;
      shareSent(share.id);
    }
  },
);

/**
 * Take something a peer shared. Anyone who can put this on the wire already
 * holds this device's endpoint id, which is the only thing ever checked.
 */
export const $receiveShare = collect(
  [$shareReceived],
  (shareReceived) => (endpointId: string, body: string) => {
    shareReceived({
      id: crypto.randomUUID(),
      endpointId,
      body,
      at: Date.now(),
    });
  },
);

/**
 * Share what the composer holds: queue it, clear the draft, and send it
 * straight out if the peer is here to take it. If it isn't, the share stays
 * queued and the next link carries it.
 *
 * A body with nothing in it is dropped. The composer's own button is
 * disabled for one, so getting here with one means whitespace.
 */
export const $shareText = collect(
  [$shareQueued, $peerHandles, $flushShares],
  (shareQueued, handles, flushShares) =>
    async (endpointId: string, body: string) => {
      if (!normalizeShare(body)) return;

      shareQueued({
        id: crypto.randomUUID(),
        endpointId,
        body,
        at: Date.now(),
      });

      const link = handles().get(endpointId);
      if (link) await flushShares(link);
    },
);
