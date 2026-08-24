import { LABEL_MAX_LENGTH } from './state/labels';
import { SHARE_MAX_LENGTH } from './state/share-body';

/**
 * The vocabulary two beam endpoints speak, and the bytes it rides as.
 *
 * At the top of the package rather than under `state/` because it is not
 * state: it is the wire, and both sides of the worker boundary need it. The
 * p2p worker encodes and decodes with it, and the state layer builds the
 * messages it sends. Nothing here imports anything but the two length limits
 * it enforces, so it costs a worker bundle nothing to pull in.
 */

/**
 * The ALPN two beam endpoints negotiate on. iroh dispatches inbound
 * connections by it, so both halves of a link must agree — and versioning
 * it here is what lets a future format land without a peer on the old one
 * mistaking it for something it can read.
 */
export const BEAM_PROTOCOL = 'beam/0';

/**
 * Largest inbound message the transport will read off a stream. Everything
 * spoken here is a short control frame — the longest is a share, capped far
 * below this — so it's a ceiling on what an unauthenticated peer can make
 * the browser buffer rather than a budget anything real approaches.
 */
export const MAX_MESSAGE_BYTES = 64 * 1024;

/**
 * What two beam endpoints say to each other over a peer link.
 *
 * Reaching this device at all means holding its endpoint id, which is a
 * 32-byte public key nobody guesses — so a peer on the wire is one that was
 * given the address. That's what stands in for a handshake, and it's why
 * there's no message here for agreeing to anything.
 *
 * It bounds who can speak, not what they can say. The fields still arrive
 * from another device and are still treated as such: the decoder is the
 * boundary, and what it lets through is text, never markup and never a
 * command.
 *
 * The wire format is JSON in UTF-8, one message per iroh stream — the
 * stream boundary is the message boundary, so nothing here has to frame
 * itself. Cheap to read in a log, and what rides it — a greeting and short
 * pieces of text — is nowhere near the size where the encoding would show.
 */

/** A message one endpoint sends another. */
export type BeamMessage =
  /**
   * "Here's what I call myself." Sent by both sides the moment a link comes
   * up, so a peer has a name before anyone has decided anything. Only ever a
   * suggestion — the address book keeps it apart from the local name, which
   * always wins.
   */
  | { readonly type: 'hello'; readonly label: string }
  /**
   * "Here's something." The point of the whole app: a note or a link, sent
   * from one device to another.
   */
  | { readonly type: 'share'; readonly body: string };

/** "Here's what I call myself." */
export const helloMessage = (label: string): BeamMessage => ({
  type: 'hello',
  label,
});

/** "Here's something." */
export const shareMessage = (body: string): BeamMessage => ({
  type: 'share',
  body,
});

/** Render a message as the bytes that go on the wire. */
export const encodeMessage = (message: BeamMessage): Uint8Array =>
  new TextEncoder().encode(JSON.stringify(message));

/**
 * Read a message off the wire, or `null` if it wasn't one. Everything is
 * checked rather than asserted — the bytes came from a stranger, so a
 * malformed frame, an unknown type, or a field of the wrong shape is
 * discarded rather than trusted into the address book.
 *
 * The advertised name is bounded here as well as normalized downstream: this
 * is the edge, and refusing an absurd one outright beats truncating it into
 * something that looks deliberate.
 */
export const decodeMessage = (bytes: Uint8Array): BeamMessage | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const message = parsed as Record<string, unknown>;

  switch (message.type) {
    case 'hello':
      return typeof message.label === 'string' &&
        message.label.length <= LABEL_MAX_LENGTH
        ? helloMessage(message.label)
        : null;

    case 'share':
      // Bounded here as well as normalized downstream, for the same reason
      // as a name: this is the edge, and a body the transport couldn't have
      // carried is a frame worth disbelieving whole.
      return typeof message.body === 'string' &&
        message.body.length <= SHARE_MAX_LENGTH
        ? shareMessage(message.body)
        : null;

    default:
      return null;
  }
};
