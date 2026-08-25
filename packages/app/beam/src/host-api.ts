import type { BeamMessage } from './protocol';

/**
 * What the p2p worker tells the page, unprompted.
 *
 * Lives at the top of the package, free of host runtime deps, so the worker can
 * import {@link HostApi} to type its notifications without dragging the page's
 * `Worker`-spawning graph into a worker-typed build. Nothing here imports
 * anything but a type.
 *
 * All of it is news rather than answers. A request has a caller waiting; these
 * arrive because something happened on the wire, and the page folds them into
 * state on its own schedule.
 */

/**
 * Where a worker event lands. Implemented by the host client, which routes each
 * one into the queue a saga is pulling from.
 *
 * A parameter rather than a fixed set of handlers because the worker outlives
 * any one visit to beam: each visit attaches its own sink, and events arriving
 * between visits have nowhere to go and are dropped.
 */
export interface P2pEventSink {
  /**
   * A peer dialled us. Inbound only — an outbound dial learns its handle from
   * the `dial` reply, and routing it through here as well would have the accept
   * loop greet a peer this device went looking for.
   */
  peerConnected(peer: { peerId: string; endpointId: string }): void;

  /** A peer said something. Already decoded, and already vouched for. */
  peerMessage(arrival: { peerId: string; message: BeamMessage }): void;

  /** A connection ended, whichever side ended it. */
  peerClosed(peer: { peerId: string }): void;

  /**
   * The relay carrying this endpoint changed, or went away. Fires for the first
   * relay too, so coming up is an arrival like any other rather than something
   * the reader has to infer from the join.
   */
  relayChanged(change: { homeRelay: string | null }): void;
}

/** What the page does with the worker's lifecycle news. */
export interface HostLifecycle {
  /** The wasm is live and the worker will answer requests. */
  onReady: () => void;

  /** The worker is up but unusable, and said so itself. */
  onFailed: (failure: { reason: string }) => void;

  /** The current visit's sink, or `undefined` between visits. */
  sink: () => P2pEventSink | undefined;
}

/**
 * Build the page's handlers for one worker.
 *
 * `ready` and `failed` are the worker's one-shot verdicts on its own startup;
 * the host holds every request until one of them lands. The rest are forwarded
 * to whichever sink the current visit installed — `undefined` between visits,
 * which is why each one checks.
 */
export const createHostHandlers = ({
  onReady,
  onFailed,
  sink,
}: HostLifecycle) => ({
  events: {
    ready: onReady,

    /**
     * The worker came up but can't work — its wasm never initialized, so
     * every request from here would trap.
     *
     * Worth a channel of its own: a worker that fails this way stays alive,
     * so it fires neither `error` nor `messageerror`, and without this the
     * page would sit on a handshake that has already lost.
     */
    failed: onFailed,

    peerConnected: (peer: { peerId: string; endpointId: string }) =>
      sink()?.peerConnected(peer),
    peerMessage: (arrival: { peerId: string; message: BeamMessage }) =>
      sink()?.peerMessage(arrival),
    peerClosed: (peer: { peerId: string }) => sink()?.peerClosed(peer),
    relayChanged: (change: { homeRelay: string | null }) =>
      sink()?.relayChanged(change),
  },
});

/**
 * The page's surface, as the worker sees it. Derived from
 * {@link createHostHandlers} rather than restated, so the two can't drift.
 */
export type HostApi = ReturnType<typeof createHostHandlers>;
