import { LABEL_MAX_LENGTH } from '../labels';
import { SHARE_MAX_LENGTH } from './shares';

/**
 * What two beam endpoints say to each other over a peer link. Everything
 * here is spoken before either side has agreed to anything, so every field
 * arrives from an unauthenticated stranger and is treated as such: the
 * decoder is the trust boundary, and what it lets through is text, never
 * markup and never a command.
 *
 * The wire format is JSON in UTF-8, one message per iroh stream — the
 * stream boundary is the message boundary, so nothing here has to frame
 * itself. Cheap to read in a log, and what rides it — a handshake and short
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
   * "I've accepted you." Sent when the reader accepts a request, and again
   * on every later link to a peer already trusted — so an acceptance made
   * while the other side was away still lands, without either device having
   * to remember it was owed.
   *
   * Believing one is the sharp edge: a stranger can send this unprompted, so
   * it only means anything when we're the ones waiting. See
   * `pairingConfirmedTopic`, which is where that rule is enforced.
   */
  | { readonly type: 'accept' }
  /**
   * "Here's something." The point of the whole app: a note or a link, sent
   * from one paired device to another.
   *
   * Only believed from a peer the reader accepted — see `receiveShareSaga`,
   * which drops one from anybody else. A stranger can put this on the wire
   * the moment it dials, and a device that shows unsolicited text from
   * whoever asks is a device that can be shouted at.
   */
  | { readonly type: 'share'; readonly body: string };

/** "Here's what I call myself." */
export const helloMessage = (label: string): BeamMessage => ({
  type: 'hello',
  label,
});

/** "I've accepted you." */
export const acceptMessage = (): BeamMessage => ({ type: 'accept' });

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

    case 'accept':
      return acceptMessage();

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
