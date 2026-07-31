import init, { Endpoint, Identity, type PeerConnection } from '@crate/iroh';
import initQrCode, { encode } from '@crate/qr-code';
import { createLogger, toError } from '@lib/observability';
import { read, write, type VaultId } from '@lib/vault';
import { createInbox, type Inbox } from './inbox';
import {
  BEAM_PROTOCOL,
  MAX_MESSAGE_BYTES,
  decodeMessage,
  encodeMessage,
  type BeamMessage,
} from './protocol';
import type { QrGrid } from './qr-code';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Vault id the endpoint's secret key is persisted under, namespaced per the
 * vault's id convention. The key is the private half of the endpoint's
 * identity — and thus its beam link — so it goes through `@lib/vault`, which
 * encrypts it at rest under a non-extractable AES-GCM key rather than leaving
 * the raw bytes on disk in the clear.
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
 * This device's identity as plain data: the address it advertises, and the
 * key that address is derived from.
 *
 * Plain data rather than the wasm {@link Identity} on purpose. The address is
 * readable the moment the key is — no network involved — so the view can name
 * this device and render its beam link long before the relay handshake lands.
 * Getting there means the identity has to cross from one capability call to
 * the next, and a wasm handle held across a saga step is a handle that leaks
 * if the scope dies between them. Bytes don't leak, and minting the handle
 * again from them is a key derivation, not a round trip.
 */
export interface SelfKey {
  /** The address peers dial to reach this device, as a hex string. */
  readonly endpointId: string;

  /** The raw secret key. Never commit this to a store — it *is* the device. */
  readonly secretKey: Uint8Array;
}

/**
 * A live endpoint and the queues its handlers fill.
 *
 * Bundled because the queues are only reachable through the handlers the
 * endpoint was defined with — there's no way to ask an endpoint for them after
 * the fact, which is the point: the handler can't be missing when a peer
 * arrives.
 */
export interface EndpointSession {
  /** The live endpoint. Dialling goes through it. */
  readonly endpoint: Endpoint;

  /**
   * Peers that dialled us, queued as they arrive. Filled from the moment the
   * endpoint is defined — before it joins — so an inbound dial landing
   * during the handshake isn't turned away.
   */
  readonly peers: Inbox<PeerLink>;

  /**
   * Every change to the relay carrying this endpoint: the server's URL, or
   * `null` when there isn't one. Filled from the same moment as
   * {@link EndpointSession.peers}, so the first connection is an arrival like
   * any other rather than something the reader has to infer from the join.
   */
  readonly relay: Inbox<string | null>;

  /** Leave the relay network and stop listening. */
  release(): void;
}

/**
 * A live link to one peer and the queue its message handler fills. Bundled
 * for the same reason as {@link EndpointSession}: the queue is only reachable
 * through the handler wired onto the connection.
 *
 * The same shape in both directions — a dial and an inbound connection
 * differ only in who started them.
 */
export interface PeerLink {
  /** The peer's endpoint public key. */
  readonly endpointId: string;

  /** The transport underneath, for sending. */
  readonly connection: PeerConnection;

  /** Messages from this peer, queued as they decode. */
  readonly messages: Inbox<BeamMessage>;

  /**
   * Settles when the connection ends, whichever side ended it and whether it
   * was deliberate or the transport giving out. Read once and held, because
   * the wasm getter starts a fresh wait on every read.
   */
  readonly closed: Promise<unknown>;

  /** Close the connection and stop listening. */
  release(): void;
}

/**
 * Wire a live connection into a {@link PeerLink}, decoding inbound messages
 * into its queue. Anything that doesn't decode is dropped here: the bytes
 * came from a stranger, and a frame we can't read is not an event worth
 * waking a saga for.
 *
 * A queue rather than a callback because the consumer is a saga, which pulls
 * one arrival at a time.
 */
const linkPeer = (connection: PeerConnection): PeerLink => {
  const endpointId = connection.endpointId;
  const messages = createInbox<BeamMessage>();

  // Read once, here. The getter mints a fresh wait per read, and this one is
  // taken before anything can close the connection — so the far side hanging
  // up is observed even if nothing gets around to awaiting it until later.
  const closed = connection.closed;

  connection.onmessage = (bytes) => {
    const message = decodeMessage(bytes);

    if (!message) {
      logger.warn('Discarded an unreadable message from a peer.', {
        endpointId,
      });
      return;
    }

    logger.debug('Received a peer message.', {
      endpointId,
      type: message.type,
    });

    messages.push(message);
  };

  return {
    endpointId,
    connection,
    messages,
    closed,
    // Freeing the handle takes the message handler with it and closes the
    // connection, which is also what settles `closed` — so hanging up here
    // is heard by the peer, and by whatever is parked on that promise.
    release: () => connection.free(),
  };
};

/**
 * Define the endpoint, queues and all, without joining.
 *
 * Both handlers are part of the definition rather than something registered
 * afterwards, so the queues are filling from the moment the endpoint exists —
 * there is no window in which a peer could dial in and find nobody home, nor
 * one in which the relay could come up unobserved.
 *
 * Frees the identity on the way out: the endpoint copies the key it binds
 * under, and the endpoint id stays readable from the endpoint itself, so
 * holding both would only be a second handle to keep track of.
 */
const defineSession = (identity: Identity): EndpointSession => {
  const peers = createInbox<PeerLink>();
  const relay = createInbox<string | null>();
  let endpoint: Endpoint;

  try {
    endpoint = Endpoint.from(identity, {
      protocols: { [BEAM_PROTOCOL]: { maxMessageSize: MAX_MESSAGE_BYTES } },
      onPeerConnection: (_protocol, connection) => {
        const peer = linkPeer(connection);
        logger.debug('Peer connected.', { endpointId: peer.endpointId });
        peers.push(peer);
      },
      // `undefined` and `null` mean the same thing here — nothing is carrying
      // us — and a queue of one shape is easier to fold than a queue of two.
      onConnectionChange: (homeRelay) => {
        logger.debug('Relay connection changed.', {
          homeRelay: homeRelay ?? null,
        });

        relay.push(homeRelay ?? null);
      },
    });
  } finally {
    identity.free();
  }

  return { endpoint, peers, relay, release: () => endpoint.free() };
};

/**
 * Instantiate the iroh wasm module and settle this device's identity, without
 * touching the network. Client-only — the wasm fetch can't run during
 * prerender — but far quicker than the handshake that follows, which is the
 * point of it being its own step: the address is derived from the key, so the
 * view can name this device and render its beam link while the relay is still
 * being dialled.
 *
 * Reuses a saved identity, or mints a fresh one, so the address (and thus the
 * beam link) survives a reload. A fresh key is persisted in the background: it
 * only decides whether *next* time reuses this identity, so nothing here has
 * to wait for the write.
 *
 * Hands back plain bytes rather than the wasm handle. The handle would have to
 * survive until {@link openConnection} takes it, and one held across a saga
 * step leaks if the scope dies in between.
 */
export const loadIdentity = async (signal: AbortSignal): Promise<SelfKey> => {
  try {
    await init();
    signal.throwIfAborted();
    logger.debug('Iroh wasm initialized.');

    const restored = await restoreSecretKey();
    signal.throwIfAborted();

    const identity = restored ? Identity.from(restored) : Identity.create();

    let self: SelfKey;
    try {
      self = {
        endpointId: identity.endpointId,
        secretKey: identity.secretKey,
      };
    } finally {
      identity.free();
    }

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
 * Define an endpoint under this device's identity and join the public relay
 * network. Client-only, and the slow half of coming up: the handshake is a
 * round trip to a relay server.
 *
 * Inbound peers and relay changes are queued from the moment the endpoint is
 * defined — the handlers are part of its definition — so nothing arriving
 * during the handshake is missed.
 *
 * Cancellation is cooperative: iroh's own `join()` isn't interruptible, so
 * after each `await` we bail on the signal, releasing a late-arriving session
 * so its connection doesn't linger.
 */
export const openConnection = async (
  signal: AbortSignal,
  self: SelfKey,
): Promise<EndpointSession> => {
  try {
    signal.throwIfAborted();
    const session = defineSession(Identity.from(self.secretKey));

    try {
      await session.endpoint.join();
    } catch (error) {
      // Nothing else holds the session yet, so a failed connect has to
      // release it here or the endpoint and its listeners are stranded.
      session.release();
      throw error;
    }

    // The handshake can't be interrupted, so a session that lands after the
    // abort has to be released here or its relay connection lingers.
    if (signal.aborted) session.release();
    signal.throwIfAborted();

    logger.debug('Connected to iroh relay.', {
      endpointId: session.endpoint.id,
      homeRelay: session.endpoint.homeRelay,
    });

    return session;
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
 * Wait for the next arrival in a queue. Rejects when the scope is released,
 * which is what unwinds the saga loops parked on one.
 */
export const receiveNext = <T>(
  signal: AbortSignal,
  inbox: Inbox<T>,
): Promise<T> => inbox.next(signal);

/**
 * Dial the peer named in a beam link over the live endpoint, resolving with
 * the link once it's established.
 *
 * Logs the outcome here rather than from the saga, so it sits alongside the
 * `Peer connected.` log the inbound listener writes — both halves of a peer
 * connection are observed from this layer. A failed dial is reported and
 * rethrown: the caller renders the peer as unreachable, which it can only do
 * if it hears about it.
 *
 * The signal goes unused: iroh's `dial()` isn't interruptible. A link that
 * lands after the scope died is released by the cell holding it, or never
 * reaches one — an abandoned handle closes with the endpoint it rode in on.
 */
export const dialEndpoint = async (
  _signal: AbortSignal,
  endpoint: Endpoint,
  endpointId: string,
): Promise<PeerLink> => {
  try {
    const peer = linkPeer(await endpoint.dial(endpointId, BEAM_PROTOCOL));
    logger.debug('Dialed peer.', { endpointId: peer.endpointId });
    return peer;
  } catch (error) {
    logger.error('Failed to dial peer.', {
      endpointId,
      error: toError(error),
    });

    throw error;
  }
};

/**
 * Send one message over a peer link, resolving with whether it landed.
 *
 * Never rejects. The announcements — a name, an acceptance — have already
 * committed their local half by the time this runs, so a failure costs the
 * peer its notification rather than the pairing, and the acceptance is
 * re-sent on the next link anyway. Those callers ignore the answer.
 *
 * A share does not: it stays queued until it's actually on the wire, so it
 * needs to hear that this didn't work. Reporting rather than throwing keeps
 * one send path for both, since a dead link is an ordinary outcome here and
 * not an exceptional one.
 */
export const sendMessage = async (
  _signal: AbortSignal,
  peer: PeerLink,
  message: BeamMessage,
): Promise<boolean> => {
  try {
    await peer.connection.send(encodeMessage(message));
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
 * Put text on the clipboard, resolving with whether it worked. The API is
 * permissioned and unavailable outside a secure context, and a refusal is a
 * perfectly ordinary answer — so it's reported rather than thrown, and the
 * caller simply doesn't claim to have copied anything.
 */
export const copyText = async (
  _signal: AbortSignal,
  text: string,
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.warn('Could not copy to the clipboard.', { error: toError(error) });
    return false;
  }
};

/**
 * Wait, then carry on — the timer behind a confirmation that takes itself
 * away. Rejects if the scope is released first, so the saga unwinds with
 * everything else rather than committing into a torn-down runtime.
 */
export const wait = (
  signal: AbortSignal,
  milliseconds: number,
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason as Error);
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abandon);
      resolve();
    }, milliseconds);

    const abandon = () => {
      clearTimeout(timer);
      reject(signal.reason as Error);
    };

    signal.addEventListener('abort', abandon, { once: true });
  });

/**
 * Mint an id for a share. Only ever compared and used as a list key, so
 * anything unique does — a capability rather than a bare `randomUUID()` for
 * the same reason as the clock: it keeps the sagas deterministic under test.
 */
export const newShareId = (): string => crypto.randomUUID();

/**
 * Close a peer link. Releasing the handle is what closes the connection and
 * stops its receive loop, so this is how a link ends before the scope does.
 */
export const releasePeer = (_signal: AbortSignal, peer: PeerLink): void => {
  peer.release();
};

/**
 * Wait for a peer link to end — the far side closing it, this side releasing
 * it, or the transport giving out. Resolves rather than reports which: from
 * the reader's side there is no difference between a device that walked away
 * and one whose connection dropped, and claiming to know would be a guess.
 *
 * Rejects if the scope is released first, so the saga parked on this unwinds
 * with everything else instead of committing into a torn-down runtime — which
 * is the ordinary case, since releasing the scope is itself what closes the
 * connection.
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

    // `finally`, not `then`: the promise settles either way when the
    // connection ends, and the reason it carries is the transport's business.
    void peer.closed.finally(() => {
      signal.removeEventListener('abort', abandon);
      resolve();
    });
  });

/**
 * The beam link to an endpoint — the `/beam/share/:id` URL a peer opens to
 * dial us, keyed by the endpoint's public identity. Only ever built
 * client-side (the endpoint is `null` until the client-only connect lands), so
 * `window.location.origin` is safe to read.
 */
export const beamLink = (endpointId: string): string =>
  new URL(`/beam/share/${endpointId}`, window.location.origin).href;

/**
 * The wasm init promise, memoized so the module instantiates once and every
 * later encode reuses it — and so concurrent first calls collapse onto a
 * single fetch rather than racing two instantiations.
 */
let wasmReady: Promise<unknown> | undefined;

/**
 * Encode this endpoint's beam link into a QR module grid, instantiating the
 * encoder wasm on first use. Copies `size`/`modules` out of the wasm handle
 * into a plain {@link QrGrid} and frees the handle, so the result owns its
 * bytes and nothing downstream touches wasm memory. Client-only — neither the
 * wasm nor `window.location` is available during SSG.
 *
 * Never rejects. A failed encode is non-fatal — the link is still copyable
 * from its text field — so it resolves to `null` rather than sinking the
 * connection landing alongside it.
 */
export const encodeBeamCode = async (
  signal: AbortSignal,
  endpointId: string,
): Promise<QrGrid | null> => {
  try {
    wasmReady ??= initQrCode();
    await wasmReady;
    signal.throwIfAborted();

    const code = encode(beamLink(endpointId));
    const grid: QrGrid = { size: code.size, modules: code.modules };
    code.free();
    return grid;
  } catch (error) {
    if (!signal.aborted) {
      logger.error('Failed to encode the beam link as a QR code.', {
        error: toError(error),
      });
    }

    return null;
  }
};
