import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import { createLogger, toError } from '@lib/observability';
import { read, write, type VaultId } from '@lib/vault';
import P2pWorker from '../../worker/index?worker';
import {
  createHostHandlers,
  type HostApi,
  type P2pEventSink,
} from '../../host-api';
import type { P2pApi } from '../../worker/rpc';
import type { SelfKey } from '../../worker/session';
import { createInbox, type Inbox } from './inbox';
import type { BeamMessage } from '../../protocol';

/**
 * The page's end of the p2p worker: settling this device's key, joining the
 * relay network under it, dialling peers, and moving messages over the links
 * that result.
 *
 * Every capability here reads the way it always did — a signal-first function a
 * saga `call`s — but the work now happens on another thread. What comes back is
 * plain data and opaque ids; the wasm handles stay where they were minted, so
 * there is nothing here a scope could leak by dying at the wrong moment.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

export type { SelfKey };

/**
 * Vault id the endpoint's secret key is persisted under, namespaced per the
 * vault's id convention. The key is the private half of the endpoint's
 * identity — and thus its beam link — so it goes through `@lib/vault`, which
 * encrypts it at rest under a non-extractable AES-GCM key rather than leaving
 * the raw bytes on disk in the clear.
 *
 * Reading and writing it stayed on this thread when the wasm left. It's
 * IndexedDB and Web Crypto, which have no reason to move, and moving them
 * wouldn't hide anything: the plaintext key exists here either way, because
 * here is where the vault decrypts it.
 */
const SECRET_KEY_ID: VaultId = 'iroh/secret-key';

/**
 * Restore the saved endpoint key, or `undefined` if none is stored. A failed
 * read (e.g. IndexedDB blocked in private mode, or a cleared encryption key) is
 * logged and swallowed: persistence is a convenience, so we fall back to
 * minting a fresh identity rather than failing the connect outright.
 */
const restoreSecretKey = async (): Promise<Uint8Array | undefined> => {
  try {
    const stored = await read(SECRET_KEY_ID);
    return stored ? new Uint8Array(stored) : undefined;
  } catch (error) {
    logger.warn('Could not read the saved endpoint key; minting a fresh one.', {
      error: toError(error),
    });
    return undefined;
  }
};

/**
 * Persist the endpoint's key so its identity — and beam link — survives a
 * reload. Best-effort for the same reason as {@link restoreSecretKey}: a
 * failed write only means the identity may change next time, not that this
 * connection is unusable.
 */
const persistSecretKey = async (secretKey: Uint8Array): Promise<void> => {
  try {
    await write(SECRET_KEY_ID, secretKey);
  } catch (error) {
    logger.warn('Could not persist the endpoint key; identity may change.', {
      error: toError(error),
    });
  }
};

/**
 * A live link to one peer and the queue its messages land in.
 *
 * The connection itself is in the worker; what's here is the id naming it, the
 * queue a saga pulls from, and two closures that reach across. The same shape
 * in both directions — a dial and an inbound connection differ only in who
 * started them.
 */
export interface PeerLink {
  /** The peer's endpoint public key. */
  readonly endpointId: string;

  /** Messages from this peer, queued as they arrive already decoded. */
  readonly messages: Inbox<BeamMessage>;

  /**
   * Settles when the connection ends, whichever side ended it and whether it
   * was deliberate or the transport giving out.
   */
  readonly closed: Promise<void>;

  /** Send one message, rejecting if it didn't land. */
  send(message: BeamMessage): Promise<void>;

  /** Close the connection and stop listening. */
  release(): void;
}

/**
 * One visit to beam: the queues this device's news lands in, and the handful
 * of things it can ask the network to do.
 *
 * Scoped to the visit rather than to the page, unlike the worker behind it. A
 * session is what `beamScope` owns and what releasing the scope ends.
 */
export interface P2pSession {
  /**
   * Peers that dialled us, queued as they arrive. Filled from the moment the
   * worker's endpoint is defined — before it joins — so an inbound dial
   * landing during the handshake isn't turned away.
   */
  readonly peers: Inbox<PeerLink>;

  /**
   * Every change to the relay carrying this endpoint: the server's URL, or
   * `null` when there isn't one. Filled from the same moment as
   * {@link P2pSession.peers}, so the first connection is an arrival like any
   * other rather than something the reader has to infer from the join.
   */
  readonly relay: Inbox<string | null>;

  /** Settle this device's identity, minting a key if the vault had none. */
  loadIdentity(secretKey: Uint8Array | undefined): Promise<SelfKey>;

  /** Bind an endpoint under that identity and join the relay network. */
  join(): Promise<void>;

  /** Dial a peer, resolving with the link once it's established. */
  dial(endpointId: string): Promise<PeerLink>;

  /** Leave the relay network and end this visit. See {@link attachSession}. */
  release(): void;
}

/**
 * What the host holds for one peer id, ahead of knowing anything else about it.
 *
 * Split out from {@link PeerLink} because of one narrow race. A dial's reply
 * resolves a promise, and the saga that acts on it runs a microtask later — so
 * a message arriving in that gap is announced for a peer id the host has never
 * heard of. The queue and the close promise are therefore created by whichever
 * arrives first, and the link is built over them afterwards.
 *
 * Only dials race. An inbound peer is announced from inside iroh's accept
 * handler, before anything can be read off the connection, and delivery is in
 * order — so `peerConnected` always precedes its peer's first message.
 */
interface PeerEntry {
  readonly messages: Inbox<BeamMessage>;
  readonly closed: Promise<void>;
  settle(): void;
}

/** A promise and the ability to resolve it from elsewhere. */
const createEntry = (): PeerEntry => {
  let settle!: () => void;
  const closed = new Promise<void>((resolve) => {
    settle = resolve;
  });

  return { messages: createInbox<BeamMessage>(), closed, settle };
};

/**
 * Everything one visit's news can land on: the worker's own events, plus the
 * one thing the worker is in no position to report.
 *
 * A thread that crashed can't announce that it crashed, so the host raises
 * {@link SessionFeed.lost} on its behalf. It's on the feed rather than beside
 * it because the session is the only thing holding the queues that have to be
 * unblocked, and it goes out of reach the moment the visit ends.
 */
/** Whatever a give-up can say for itself, beyond naming what went wrong. */
type FailureDetails = Partial<{
  error: Error;
  reason: string;
  filename: string;
  lineno: number;
}>;

export interface SessionFeed extends P2pEventSink {
  /** The thread is gone. Nothing further is coming over it. */
  lost(): void;
}

/**
 * The worker, and the page-long RPC bound to it.
 *
 * Held here rather than in a scope on purpose. The worker outlives any one
 * visit to beam: releasing `beamScope` ends the *session* — the endpoint leaves
 * the relay network — but the thread stays up with its wasm warm and its
 * identity settled.
 *
 * That isn't only an optimisation, though returning to beam without refetching
 * two megabytes of wasm is a real one. Tying the worker's life to the scope
 * would mean a reader who navigates away and straight back can have a second
 * worker restore the same key and join while the first is still winding down —
 * two endpoints bound under one address, with the relay left to pick which one
 * receives. Never having two is simpler than racing them.
 */
interface P2pWorkerHost {
  readonly worker: Worker;
  readonly rpc: RPC<HostApi, P2pApi, SendOptions>;
  readonly ready: Promise<void>;

  /** Where the current visit's news goes, or `undefined` between visits. */
  sink: SessionFeed | undefined;

  /** Set when the thread died under us; the next visit spawns a fresh one. */
  dead: boolean;

  /**
   * Give up on this thread: say why, unpark everything waiting on it, and
   * mark it for replacement on the next visit.
   *
   * Idempotent, because the ways a worker can die aren't exclusive — a thread
   * that throws on its way out may report the failure itself first.
   */
  fail(reason: string, details?: FailureDetails): void;
}

let host: P2pWorkerHost | undefined;

/**
 * Spawn the worker and bind the page's end of the RPC to it, resolving its
 * `ready` promise once the wasm is live.
 *
 * The handlers are installed once, for the life of the thread, and forward to
 * whichever sink the current visit installed — so a second visit re-points the
 * feed rather than stacking a second set of listeners.
 */
const spawnWorker = (): P2pWorkerHost => {
  const worker = new P2pWorker({ name: '@app/beam' });

  let markReady!: () => void;
  const ready = new Promise<void>((resolve) => {
    markReady = resolve;
  });

  const spawned: P2pWorkerHost = {
    worker,
    ready,
    sink: undefined,
    dead: false,
    rpc: RPC.from<HostApi, P2pApi, SendOptions>(
      new MessagePortTransport<RpcMessage, RpcMessage>(worker),
      createHostHandlers({
        onReady: markReady,
        onFailed: ({ reason }) =>
          spawned.fail('The p2p worker reported a fatal error.', { reason }),
        sink: () => spawned.sink,
      }),
    ),

    // A thread that dies takes every connection with it, and nothing else
    // would ever say so: no `peerClosed` arrives, so every link's `closed`
    // stays pending, the saga parked on it never wakes, and the status bar
    // goes on claiming a relay nothing is holding.
    fail(reason, details) {
      if (this.dead) return;
      this.dead = true;

      logger.error(reason, details);
      this.sink?.lost();

      // Whoever is waiting on the handshake is waiting on a thread that will
      // never answer. Let them through to fail on their next request instead.
      markReady();
    },
  };

  worker.addEventListener('error', (event) => {
    // `error` is null whenever the browser withholds the detail, so the
    // event's own fields are the whole account we get. They're logged beside
    // the error rather than folded into it, since a `CoercedError: null`
    // would name neither the file nor the line.
    spawned.fail('The p2p worker threw and stopped.', {
      error: toError(event.error ?? event.message),
      filename: event.filename,
      lineno: event.lineno,
    });
  });

  worker.addEventListener('messageerror', () => {
    // Not a crash — the thread is alive, but a frame arrived that couldn't be
    // deserialized. Fatal all the same: RPC has no timeout, so whichever
    // caller that frame was answering would wait on it for good.
    spawned.fail('The p2p worker sent a message the page could not read.');
  });

  return spawned;
};

/**
 * The page's worker, spawned on first use and replaced if it ever died.
 *
 * Terminating it isn't part of any teardown path: nothing holds a reference
 * that could outlive the page, and a worker sitting idle between visits is
 * costing a resident wasm module rather than doing anything.
 */
const workerHost = (): P2pWorkerHost => {
  if (host?.dead) host = undefined;
  host ??= spawnWorker();
  return host;
};

/**
 * Wire one visit's session onto a live RPC: the queues, the peer registry, and
 * the routing that fills them.
 *
 * Takes the RPC rather than spawning anything, so this — which is all the logic
 * — can be driven over a plain `MessageChannel` in a test while
 * {@link startP2p} keeps the one part that needs a real thread.
 */
export const attachSession = (
  rpc: RPC<HostApi, P2pApi, SendOptions>,
  install: (feed: SessionFeed | undefined) => void,
): P2pSession => {
  const peers = createInbox<PeerLink>();
  const relay = createInbox<string | null>();
  const registry = new Map<string, PeerEntry>();

  /**
   * This peer's entry, creating it if news of it arrived first.
   *
   * Entries are never removed. A peer id names one connection for the whole
   * life of the session, so the entry under it is the single answer to "what
   * happened to that connection" — and removing a settled one would only mean
   * the next mention of that id quietly built a second, unsettled answer.
   * Which is precisely the bug: a close that beats its own dial reply would
   * leave the link's `closed` pending forever, and the saga watching it parked.
   *
   * Bounded by connections made this visit, which is the same order as the
   * handle map the session already keeps.
   */
  const entryFor = (peerId: string): PeerEntry => {
    const existing = registry.get(peerId);
    if (existing) return existing;

    const created = createEntry();
    registry.set(peerId, created);
    return created;
  };

  /**
   * Build the link for a connection the worker has filed, over whatever
   * already accumulated under its id.
   *
   * Exactly one link per peer id, for the whole life of that id. The fold that
   * handles a closing link decides whether it's still the held one by object
   * identity, so a second link minted over the same entry would make a
   * released connection's close undo the link that replaced it.
   */
  const linkFor = (peer: { peerId: string; endpointId: string }): PeerLink => {
    const entry = entryFor(peer.peerId);

    return {
      endpointId: peer.endpointId,
      messages: entry.messages,
      closed: entry.closed,

      send: (message) => rpc.request('send', { peerId: peer.peerId, message }),

      release: () => {
        // Settle locally rather than waiting for the worker to echo the close
        // back. This is what freeing the handle used to do on this thread, and
        // the saga parked on `closed` is entitled to hear about a hang-up this
        // device chose without a round trip first.
        entry.settle();

        void rpc
          .notify('release', { peerId: peer.peerId })
          .catch((error: unknown) => {
            logger.warn('Could not hang up on a peer.', {
              endpointId: peer.endpointId,
              error: toError(error),
            });
          });
      },
    };
  };

  install({
    peerConnected: (peer) => peers.push(linkFor(peer)),
    peerMessage: ({ peerId, message }) =>
      entryFor(peerId).messages.push(message),
    peerClosed: ({ peerId }) => entryFor(peerId).settle(),
    relayChanged: ({ homeRelay }) => relay.push(homeRelay),

    lost: () => {
      // Nothing is ever going to report these closed: the thread that held
      // the connections is gone, so no `peerClosed` is coming for any of
      // them. Settle them here and each `watchPeerSaga` wakes and commits
      // the disconnect it would otherwise wait on for the life of the page.
      for (const entry of registry.values()) entry.settle();
      relay.push(null);
    },
  });

  return {
    peers,
    relay,

    loadIdentity: (secretKey) => rpc.request('loadIdentity', { secretKey }),

    join: () => rpc.request('join'),

    dial: async (endpointId) =>
      linkFor(await rpc.request('dial', { endpointId })),

    release: () => {
      // Stop routing first. Anything the worker announces from here on belongs
      // to a session nobody is holding, and the queues it would fill are about
      // to be unreachable anyway.
      install(undefined);

      // An event, not a request: this runs from a cell's synchronous drop hook,
      // so there is nobody left to resolve an answer to. `notify` hands the
      // message to the port before it returns, so nothing is lost by not
      // waiting on it.
      void rpc.notify('leave').catch((error: unknown) => {
        logger.debug('Could not ask the p2p worker to leave.', {
          error: toError(error),
        });
      });
    },
  };
};

/**
 * Bring up the p2p worker and open a session on it, resolving once its wasm is
 * live. Client-only — a worker can't be spawned during prerender.
 *
 * Reuses the page's worker across visits, so this is a fetch and a two-megabyte
 * compile the first time and almost nothing after that.
 *
 * Cancellation is cooperative: a spawn already under way can't be recalled, so
 * a session that becomes ready after the abort is released here rather than
 * left holding a relay connection for a page that has moved on.
 */
export const startP2p = async (signal: AbortSignal): Promise<P2pSession> => {
  const live = workerHost();
  await live.ready;

  if (live.dead) throw new Error('The p2p worker is not running.');

  const session = attachSession(live.rpc, (sink) => {
    live.sink = sink;
  });

  if (signal.aborted) session.release();
  signal.throwIfAborted();

  return session;
};

/**
 * Settle this device's identity, without touching the network.
 *
 * Far quicker than the handshake that follows, which is the point of it being
 * its own step: the address is derived from the key, so the view can name this
 * device and render its beam link while the relay is still being dialled.
 *
 * Reuses a saved identity, or mints a fresh one, so the address (and thus the
 * beam link) survives a reload. A fresh key is persisted in the background: it
 * only decides whether *next* time reuses this identity, so nothing here has to
 * wait for the write.
 *
 * A key is not a commitment. It costs nothing to hold, means nothing until
 * somebody dials it, and having one on hand is what lets a device that just
 * scanned a link answer immediately — so it's minted on arrival rather than
 * held back behind a screen the reader hasn't got to yet.
 */
export const loadIdentity = async (
  signal: AbortSignal,
  session: P2pSession,
): Promise<SelfKey> => {
  try {
    const restored = await restoreSecretKey();
    signal.throwIfAborted();

    const self = await session.loadIdentity(restored);
    signal.throwIfAborted();

    if (!restored) void persistSecretKey(self.secretKey);

    logger.debug('Endpoint identity ready.', { endpointId: self.endpointId });
    return self;
  } catch (error) {
    // An abort is ordinary teardown — the scope was released mid-load — so it
    // isn't worth reporting as a failure.
    if (!signal.aborted) {
      logger.error('Failed to settle this device’s identity.', {
        error: toError(error),
      });
    }

    throw error;
  }
};

/**
 * Join the public relay network under this device's identity. The slow half of
 * coming up: the handshake is a round trip to a relay server.
 *
 * Inbound peers and relay changes are queued from the moment the endpoint is
 * defined, so nothing arriving during the handshake is missed.
 *
 * Nothing to compensate for on an abort any more. The session is already held
 * by the cell that will release it, and releasing it tells the worker to leave —
 * so a handshake that lands after the scope died is unwound by the same path as
 * one that lands before it.
 */
export const openConnection = async (
  signal: AbortSignal,
  session: P2pSession,
): Promise<void> => {
  try {
    signal.throwIfAborted();
    await session.join();
  } catch (error) {
    if (!signal.aborted) {
      logger.error('Failed to join the iroh relay network.', {
        error: toError(error),
      });
    }

    throw error;
  }
};

/**
 * Dial the peer named in a beam link over the live session, resolving with the
 * link once it's established.
 *
 * The signal goes unused: iroh's dial isn't interruptible. A link that lands
 * after the scope died is closed by the endpoint leaving, which is what
 * releasing the session does.
 */
export const dialEndpoint = (
  _signal: AbortSignal,
  session: P2pSession,
  endpointId: string,
): Promise<PeerLink> => session.dial(endpointId);

/**
 * Send one message over a peer link, resolving with whether it landed.
 *
 * Never rejects. The announcements — a name, an acceptance — have already
 * committed their local half by the time this runs, so a failure costs the peer
 * its notification rather than the pairing, and the acceptance is re-sent on the
 * next link anyway. Those callers ignore the answer.
 *
 * A share does not: it stays queued until it's actually on the wire, so it needs
 * to hear that this didn't work. Reporting rather than throwing keeps one send
 * path for both, since a dead link is an ordinary outcome here and not an
 * exceptional one — and now that the send crosses a thread, "dead link" also
 * covers a worker that went away mid-flight.
 */
export const sendMessage = async (
  _signal: AbortSignal,
  peer: PeerLink,
  message: BeamMessage,
): Promise<boolean> => {
  try {
    await peer.send(message);
    return true;
  } catch (error) {
    logger.warn('Could not send a message to a peer.', {
      type: message.type,
      error: toError(error),
    });

    return false;
  }
};

/**
 * Close a peer link. This is how a link ends before the session does — leaving
 * a share view rather than leaving beam — so the peer is told deliberately and
 * shows this device as gone rather than as one that stopped answering.
 */
export const releasePeer = (_signal: AbortSignal, peer: PeerLink): void => {
  peer.release();
};

/**
 * Wait for a peer link to end — the far side closing it, this side releasing
 * it, or the transport giving out. Resolves rather than reports which: from the
 * reader's side there is no difference between a device that walked away and
 * one whose connection dropped, and claiming to know would be a guess.
 *
 * Rejects if the scope is released first, so the saga parked on this unwinds
 * with everything else instead of committing into a torn-down runtime.
 */
export const awaitPeerClose = (
  signal: AbortSignal,
  peer: PeerLink,
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason as Error);
      return;
    }

    const abandon = () => reject(signal.reason as Error);
    signal.addEventListener('abort', abandon, { once: true });

    void peer.closed.finally(() => {
      signal.removeEventListener('abort', abandon);
      resolve();
    });
  });
