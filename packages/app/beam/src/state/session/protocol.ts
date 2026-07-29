import { LABEL_MAX_LENGTH } from '../labels';

/**
 * What two beam endpoints say to each other over a peer link. Everything
 * here is spoken before either side has agreed to anything, so every field
 * arrives from an unauthenticated stranger and is treated as such: the
 * decoder is the trust boundary, and what it lets through is text, never
 * markup and never a command.
 *
 * The wire format is JSON in UTF-8, one message per iroh stream — the
 * stream boundary is the message boundary, so nothing here has to frame
 * itself. Cheap to read in a log, and the handshake is a handful of messages
 * per pairing rather than anything that would notice the encoding.
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
  | { readonly type: 'accept' };

/** "Here's what I call myself." */
export const helloMessage = (label: string): BeamMessage => ({
  type: 'hello',
  label,
});

/** "I've accepted you." */
export const acceptMessage = (): BeamMessage => ({ type: 'accept' });

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

    default:
      return null;
  }
};
