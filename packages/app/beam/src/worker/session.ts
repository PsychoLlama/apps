import init, { Endpoint, Identity, type PeerConnection } from '@crate/p2p';
import { createLogger, toError } from '@lib/observability';
import {
  BEAM_PROTOCOL,
  MAX_MESSAGE_BYTES,
  decodeMessage,
  encodeMessage,
  type BeamMessage,
} from '../protocol';

/**
 * Everything beam does with iroh, on the thread that owns it.
 *
 * The whole of the wasm boundary lives here. Handles are minted, held, and
 * freed inside this module; what crosses back to the page is plain data and an
 * opaque id, never a wasm object the host would have to remember to free. That
 * used to be a discipline the host had to keep — now it's a property of the
 * thread, because nothing over there can hold a handle even by accident.
 *
 * One worker holds one identity for the life of the page, and under it a
 * succession of endpoints: the page joins when it opens beam and leaves when
 * it navigates away, and each visit binds a fresh {@link Endpoint} because an
 * endpoint that has left cannot rejoin. The key outlives all of them, which is
 * what makes the address stable across those comings and goings.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * This device's identity as plain data: the address it advertises, and the key
 * that address is derived from.
 *
 * The key crosses back because the vault lives on the page — reading and
 * writing it is IndexedDB and Web Crypto, neither of which has any business
 * moving just because the wasm did. So the host reads the stored bytes and
 * hands them in; this side derives the address, and hands the bytes back only
 * when it had to mint them, so the host knows there is something new to save.
 */
export interface SelfKey {
  /** The address peers dial to reach this device, as a hex string. */
  readonly endpointId: string;

  /** The raw secret key. Never commit this to a store — it *is* the device. */
  readonly secretKey: Uint8Array;
}

/** One live connection, named by the id this worker filed it under. */
export interface PeerHandle {
  /** This worker's name for the connection. Opaque to the host. */
  readonly peerId: string;

  /** The peer's endpoint public key. */
  readonly endpointId: string;
}

/**
 * Where this worker's news goes. Implemented by the entrypoint as a set of
 * RPC notifications; taken as a parameter so nothing here has to know that,
 * and so a test could watch the same feed without a thread.
 */
export interface SessionEvents {
  /** A peer dialled us. Outbound dials are answered by `dial` instead. */
  peerConnected(peer: PeerHandle): void;

  /** A peer said something, already decoded. */
  peerMessage(arrival: { peerId: string; message: BeamMessage }): void;

  /** A connection ended, whichever side ended it. */
  peerClosed(peer: { peerId: string }): void;

  /** The relay carrying us changed, or went away. */
  relayChanged(change: { homeRelay: string | null }): void;
}

/**
 * A connection and the wait for its end, held together.
 *
 * The promise is read once, when the connection arrives, because the wasm
 * getter mints a fresh wait on every read — and it's taken before anything can
 * close the connection, so the far side hanging up is observed even if nothing
 * gets around to awaiting it until later.
 */
interface PeerEntry {
  readonly connection: PeerConnection;
  readonly closed: Promise<unknown>;
}

/** The state one worker holds for one page. */
export class WorkerSession {
  readonly #events: SessionEvents;
  readonly #peers = new Map<string, PeerEntry>();

  /**
   * The identity's raw key, kept for the life of the worker so each visit to
   * beam can bind a fresh endpoint under the same address. Held as bytes
   * rather than as an {@link Identity} handle because an endpoint consumes the
   * handle it binds under, and re-minting from bytes is a key derivation
   * rather than a round trip.
   */
  #secretKey: Uint8Array | undefined;

  /** The endpoint for the current visit, or `null` between visits. */
  #endpoint: Endpoint | null = null;

  /**
   * Ids are minted per connection rather than per peer. A second link to a
   * peer we already know replaces the first, and both are live for a beat
   * while that happens — keying on the endpoint id would collide exactly then.
   */
  #nextPeerId = 1;

  constructor(events: SessionEvents) {
    this.#events = events;
  }

  /** Instantiate the wasm. Called once, at worker load. */
  static async init(): Promise<void> {
    await init();
  }

  /**
   * Settle this device's identity from the host's stored key, or mint a fresh
   * one if there wasn't a stored key to hand.
   *
   * Idempotent across visits: the second call returns the address already
   * settled rather than minting a second identity, so navigating back into
   * beam keeps the address it left with.
   */
  loadIdentity(secretKey: Uint8Array | undefined): SelfKey {
    const identity = this.#identityFrom(secretKey);

    try {
      const self: SelfKey = {
        endpointId: identity.endpointId,
        secretKey: identity.secretKey,
      };

      this.#secretKey = self.secretKey;
      logger.debug('Endpoint identity ready.', { endpointId: self.endpointId });
      return self;
    } finally {
      identity.free();
    }
  }

  /**
   * Define an endpoint under this device's identity and join the public relay
   * network, resolving once a relay has finished its handshake.
   *
   * Inbound peers and relay changes are announced from the moment the endpoint
   * is defined — the handlers are part of its definition — so nothing arriving
   * during the handshake is missed.
   */
  async join(): Promise<void> {
    if (!this.#secretKey) {
      throw new Error('Cannot join the relay network before an identity.');
    }

    if (this.#endpoint) {
      throw new Error('This worker has already joined the relay network.');
    }

    const endpoint = this.#defineEndpoint(this.#secretKey);
    this.#endpoint = endpoint;

    try {
      await endpoint.join();
    } catch (error) {
      // Nothing else holds it yet, so a failed join has to release it here or
      // the endpoint and its listeners are stranded for the life of the page.
      this.#endpoint = null;
      endpoint.free();
      logger.error('Failed to join the iroh relay network.', {
        error: toError(error),
      });

      throw error;
    }

    logger.debug('Connected to iroh relay.', {
      endpointId: endpoint.id,
      homeRelay: endpoint.homeRelay,
    });
  }

  /** Dial a peer, resolving with the handle this worker filed it under. */
  async dial(endpointId: string): Promise<PeerHandle> {
    const endpoint = this.#endpoint;

    if (!endpoint) {
      throw new Error('Cannot dial a peer before joining the relay network.');
    }

    try {
      const handle = this.#hold(await endpoint.dial(endpointId, BEAM_PROTOCOL));
      logger.debug('Dialed peer.', { endpointId: handle.endpointId });
      return handle;
    } catch (error) {
      logger.error('Failed to dial peer.', {
        endpointId,
        error: toError(error),
      });

      throw error;
    }
  }

  /**
   * Send one message to a peer. Rejects if it didn't land — the host decides
   * what a failed send means, and for most callers it means nothing.
   *
   * An unknown id is a failed send like any other rather than a special case:
   * the connection it named is gone, which is the only thing the caller can
   * act on.
   */
  async send(peerId: string, message: BeamMessage): Promise<void> {
    const entry = this.#peers.get(peerId);
    if (!entry) throw new Error(`No live connection for peer ${peerId}.`);

    await entry.connection.send(encodeMessage(message));
  }

  /**
   * Hang up on one peer, deliberately, leaving the rest of the session up.
   *
   * Freeing the handle takes the message handler with it and closes the
   * connection — which is what tells the peer this was a decision rather than
   * a device that stopped answering. Unknown ids are ignored: the host may be
   * releasing a link this side already saw close.
   */
  release(peerId: string): void {
    const entry = this.#peers.get(peerId);
    if (!entry) return;

    this.#peers.delete(peerId);
    entry.connection.free();
  }

  /**
   * Leave the relay network, closing every peer connection deliberately on the
   * way out, and go back to holding nothing but the key.
   *
   * This is what a reader navigating away from beam looks like from here. It
   * matters that it's a real leave rather than the worker being killed: iroh's
   * close runs through the endpoint and sends each peer a close frame, so the
   * devices on the other end show this one as gone straight away instead of
   * waiting out an idle timeout.
   *
   * Deliberately does not touch {@link WorkerSession.loadIdentity}'s work. The
   * key is the page's, not the visit's, and the next visit binds a fresh
   * endpoint under it — which it must, because an endpoint that has left
   * cannot rejoin.
   */
  async leave(): Promise<void> {
    const endpoint = this.#endpoint;
    this.#endpoint = null;

    // The peer map goes now rather than in response to the closes below: those
    // connections are being torn down by the endpoint, and a `peerClosed` for
    // each of them would only tell a host that has already released the
    // session about links it has already forgotten.
    this.#peers.clear();

    if (!endpoint) return;

    try {
      await endpoint.leave();
      logger.debug('Left the iroh relay network.');
    } catch (error) {
      // Worth saying out loud. A leave that fails is the difference between
      // peers seeing this device go and peers waiting for it to time out, and
      // nothing else is watching for it — the host has let the session go.
      logger.warn('The endpoint did not leave cleanly.', {
        error: toError(error),
      });
    } finally {
      endpoint.free();
    }
  }

  /**
   * Mint or restore the identity, reusing the key already settled if there is
   * one. Restoring is what keeps the address stable; the throw on malformed
   * bytes is deliberate and reaches the host, because a stored key we can't
   * read is worth reporting rather than papering over with a new identity the
   * reader never asked for.
   */
  #identityFrom(secretKey: Uint8Array | undefined): Identity {
    const known = this.#secretKey ?? secretKey;
    return known ? Identity.from(known) : Identity.create();
  }

  /**
   * Define the endpoint, handlers and all, without joining.
   *
   * The handlers are part of the definition rather than something registered
   * afterwards, so news is flowing from the moment the endpoint exists — there
   * is no window in which a peer could dial in and find nobody home, nor one in
   * which the relay could come up unobserved.
   *
   * Frees the identity on the way out: the endpoint copies the key it binds
   * under, and the address stays readable from the endpoint itself.
   */
  #defineEndpoint(secretKey: Uint8Array): Endpoint {
    const identity = Identity.from(secretKey);

    try {
      return Endpoint.from(identity, {
        protocols: { [BEAM_PROTOCOL]: { maxMessageSize: MAX_MESSAGE_BYTES } },
        onPeerConnection: (_protocol, connection) => {
          const handle = this.#hold(connection);
          logger.debug('Peer connected.', { endpointId: handle.endpointId });
          this.#events.peerConnected(handle);
        },
        // `undefined` and `null` mean the same thing here — nothing is
        // carrying us — and one shape is easier to fold than two.
        onConnectionChange: (homeRelay) => {
          logger.debug('Relay connection changed.', {
            homeRelay: homeRelay ?? null,
          });

          this.#events.relayChanged({ homeRelay: homeRelay ?? null });
        },
      });
    } finally {
      identity.free();
    }
  }

  /**
   * File a live connection under a fresh id and start reading off it.
   *
   * Anything that doesn't decode is dropped here rather than forwarded: the
   * bytes came from a stranger, and a frame we can't read is not an event
   * worth waking a saga on another thread for. Decoding on this side is the
   * point — what reaches the page is a message this code vouched for, never
   * a stranger's bytes.
   */
  #hold(connection: PeerConnection): PeerHandle {
    const peerId = `peer-${this.#nextPeerId++}`;
    const endpointId = connection.endpointId;

    // Read once, here, before anything can close the connection. The getter
    // mints a fresh wait per read, so holding this one is what guarantees the
    // close is observed rather than raced.
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

      this.#events.peerMessage({ peerId, message });
    };

    void closed.finally(() => {
      // Only announce a close for a connection still on the books. A peer the
      // host released, or one the endpoint tore down on the way out, is
      // already forgotten on both sides — saying so again would resurrect it
      // in the host's registry with nothing left to close it.
      if (!this.#peers.has(peerId)) return;

      this.#peers.delete(peerId);
      logger.debug('Peer connection closed.', { endpointId });
      this.#events.peerClosed({ peerId });
    });

    this.#peers.set(peerId, { connection, closed });
    return { peerId, endpointId };
  }
}
