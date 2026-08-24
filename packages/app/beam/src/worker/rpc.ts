import { defineContract } from '@lib/messaging/rpc';
import type { SendOptions } from '@lib/messaging/message-port';
import type { BeamMessage } from '../protocol';
import type { PeerHandle, SelfKey, WorkerSession } from './session';

/**
 * What the page may ask this worker to do.
 *
 * Built from a live {@link WorkerSession} so the contract and the
 * implementation are one value — the host imports {@link P2pApi} to type its
 * calls, and it cannot drift from the handlers that answer them.
 *
 * Every procedure takes at most one positional parameter, so anything with
 * more than one thing to say says it in an object.
 */
export const createP2pApi = (session: WorkerSession) =>
  defineContract<SendOptions>()({
    requests: {
      /**
       * Settle this device's identity. `secretKey` is what the vault had, read
       * on the page — absent means mint a fresh one. The bytes come back
       * either way so the host can persist a key it didn't already have.
       */
      loadIdentity: (input: { secretKey?: Uint8Array }): SelfKey =>
        session.loadIdentity(input.secretKey),

      /** Bind an endpoint under the settled identity and join the relay. */
      join: (): Promise<void> => session.join(),

      /** Dial a peer, resolving with the handle the worker filed it under. */
      dial: (input: { endpointId: string }): Promise<PeerHandle> =>
        session.dial(input.endpointId),

      /**
       * Send one message, rejecting if it didn't land.
       *
       * A rejection rather than a `false`, so a dead link, a closed endpoint
       * and an id naming nothing all arrive the same way — the host folds the
       * lot to one answer in one place, with one log, rather than checking a
       * boolean *and* catching.
       */
      send: (input: { peerId: string; message: BeamMessage }): Promise<void> =>
        session.send(input.peerId, input.message),
    },

    events: {
      /**
       * Hang up on one peer, leaving the session up. An event because the
       * caller is a synchronous teardown path with nowhere to put an answer,
       * and because there is nothing useful to say back: the connection is
       * gone either way.
       */
      release: (input: { peerId: string }): void =>
        session.release(input.peerId),

      /**
       * Leave the relay network. Sent when the page stops needing a session —
       * navigating away from beam — and the worker lives on with its wasm warm
       * for whenever it comes back.
       *
       * An event, for the same reason as `release` plus one more: the host
       * cannot wait for it. It sends this from a cell's synchronous drop hook,
       * so a request's promise would have nobody left to resolve to.
       */
      leave: (): void => void session.leave(),
    },
  });

/**
 * The p2p worker's surface, derived from the implementation that serves it.
 * The host imports this to type its requests.
 */
export type P2pApi = ReturnType<typeof createP2pApi>;
