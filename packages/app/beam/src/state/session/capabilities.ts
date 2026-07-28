import init, {
  generateSecretKey,
  joinRelay,
  type PeerConnection,
  type Relay,
} from '@crate/iroh';
import initQrCode, { encode } from '@crate/qr-code';
import { createLogger, toError } from '@lib/observability';
import { read, write, type VaultId } from '@lib/vault';
import { createInbox, type Inbox } from './inbox';
import { decodeMessage, encodeMessage, type BeamMessage } from './protocol';
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
 * Instantiate the iroh wasm module and join the public relay network. Both
 * steps are async and client-only — the wasm fetches and the relay handshake
 * can't run during prerender.
 *
 * Reuses a saved identity, or mints a fresh one so the endpoint keeps a stable
 * identity (and beam link) across reloads. A fresh key is persisted in
 * parallel with the relay connect rather than before it — the connect is the
 * slow, networked step, and the write needn't gate it.
 *
 * Cancellation is cooperative: iroh's own `joinRelay()` isn't interruptible,
 * so after each `await` we bail on the signal, freeing a late-arriving relay
 * so its connection doesn't linger.
 */
export const openConnection = async (signal: AbortSignal): Promise<Relay> => {
  try {
    await init();
    signal.throwIfAborted();
    logger.debug('Iroh wasm initialized.');

    const restored = await restoreSecretKey();
    signal.throwIfAborted();

    // Reuse the saved identity, or mint one and persist it alongside the
    // connect.
    const secretKey = restored ?? generateSecretKey();
    const persisting = restored ? undefined : persistSecretKey(secretKey);

    const relay = await joinRelay(secretKey);
    await persisting;

    // The handshake can't be interrupted, so a relay that lands after the
    // abort has to be freed here or its relay connection lingers.
    if (signal.aborted) relay.free();
    signal.throwIfAborted();

    logger.debug('Connected to iroh relay.', {
      endpointId: relay.endpointId,
      homeRelay: relay.homeRelay,
    });

    return relay;
  } catch (error) {
    // An abort is ordinary teardown — the scope was released mid-connect —
    // so it isn't worth reporting as a failure.
    if (!signal.aborted) {
      logger.error('Failed to join the iroh relay network.', {
        error: toError(error),
      });
    }

    throw error;
  }
};

/**
 * A peer that dialled us, paired with the identity it dialled from. The id
 * is read here rather than in a saga because reading it crosses into wasm,
 * and everything that touches a host object belongs in this layer.
 */
export interface InboundPeer {
  /** The peer's endpoint public key. */
  endpointId: string;
  /** The live connection. The caller owns it and must free it. */
  link: PeerConnection;
}

/**
 * Start serving inbound dials, returning a queue of the peers that arrive.
 * The relay owns the accept loop, so freeing it stops the queue filling.
 *
 * A queue rather than a callback because the consumer is a saga, which pulls
 * one arrival at a time. Handles come out live and unfreed — the caller
 * talks back over them, and is responsible for closing them.
 */
export const acceptInboundPeers = (
  _signal: AbortSignal,
  relay: Relay,
): Inbox<InboundPeer> => {
  const inbox = createInbox<InboundPeer>();

  relay.acceptPeers((link) => {
    const endpointId = link.remoteId;
    logger.debug('Peer connected.', { endpointId });
    inbox.push({ endpointId, link });
  });

  return inbox;
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
 * Dial the peer named in a beam link over the live relay connection,
 * resolving with the link once it's established.
 *
 * Logs the outcome here rather than from the saga, so it sits alongside
 * {@link acceptInboundPeers}'s `Peer connected.` log — both halves of a peer
 * connection are observed from this layer. A failed dial is reported and
 * rethrown: the caller renders the peer as unreachable, which it can only do
 * if it hears about it.
 *
 * The signal goes unused: iroh's `dial()` isn't interruptible. A link that
 * lands after the scope died is freed by the cell holding it, or never
 * reaches one — an abandoned handle closes with the endpoint it rode in on.
 */
export const dialEndpoint = async (
  _signal: AbortSignal,
  relay: Relay,
  endpointId: string,
): Promise<PeerConnection> => {
  try {
    const link = await relay.dial(endpointId);
    logger.debug('Dialed peer.', { endpointId: link.remoteId });
    return link;
  } catch (error) {
    logger.error('Failed to dial peer.', {
      endpointId,
      error: toError(error),
    });

    throw error;
  }
};

/**
 * Start reading messages off a peer link, returning a queue of the ones that
 * decode. Anything that doesn't is dropped here: the bytes came from a
 * stranger, and a frame we can't read is not an event worth waking a saga
 * for.
 */
export const listenToPeer = (
  _signal: AbortSignal,
  link: PeerConnection,
): Inbox<BeamMessage> => {
  const inbox = createInbox<BeamMessage>();
  const endpointId = link.remoteId;

  link.onMessage((bytes) => {
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
    inbox.push(message);
  });

  return inbox;
};

/**
 * Send one message over a peer link.
 *
 * Reports and swallows a failed send. Every message here is an announcement
 * — a name, an acceptance — whose local half has already been committed, so
 * a failure costs the peer its notification rather than the pairing. The
 * acceptance is re-sent on the next link, which is what closes the gap.
 */
export const sendMessage = async (
  _signal: AbortSignal,
  link: PeerConnection,
  message: BeamMessage,
): Promise<void> => {
  try {
    await link.send(encodeMessage(message));
  } catch (error) {
    logger.warn('Could not send a message to a peer.', {
      type: message.type,
      error: toError(error),
    });
  }
};

/**
 * Close a peer link. Freeing the handle is what closes the connection and
 * stops its receive loop, so this is how a link ends before the scope does.
 */
export const releasePeer = (
  _signal: AbortSignal,
  link: PeerConnection,
): void => {
  link.free();
};

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
