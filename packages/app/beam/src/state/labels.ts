/**
 * What an endpoint may be called, and what it's called when nobody has said.
 *
 * A beam endpoint is a 32-byte public key
 * rendered as hex — unreadable at full length, and unmemorable at any. Until
 * someone renames it, a contact goes by the leading characters of its own key.
 *
 * A prefix rather than something friendlier: it's derived from what the key
 * actually is, so both halves of a pair land on the same name without
 * exchanging anything, and the name a peer wears is a fragment you can check
 * against the key on its own page.
 */

/**
 * How much of the key a fallback name shows. Eight hex characters is 32 bits —
 * enough that two contacts sharing a prefix is a curiosity rather than a daily
 * event, short enough to read off a screen and say out loud.
 */
const LABEL_LENGTH = 8;

/**
 * The fallback name for an endpoint: the leading characters of its key. Not
 * unique and not an identity check — it's a prefix of a public key, so it
 * narrows the field rather than proving who's on the other end. The full key
 * is on the contact's page for anyone who needs to be sure.
 */
export const generateLabel = (endpointId: string): string =>
  endpointId.slice(0, LABEL_LENGTH);

/**
 * The longest a name may be, wherever it came from. One ceiling rather than
 * two: a peer's advertised name arrives from an unauthenticated stranger and
 * has to be bounded, and a rule the reader can't see the edge of is worse
 * than one that applies everywhere. Generous for a device name, short enough
 * that a name is still a name.
 */
export const LABEL_MAX_LENGTH = 64;

/**
 * Bring a name — typed here or advertised by a peer — down to what the
 * address book stores, or `null` if nothing survives. The single authority on
 * what a name may be: folds run every name through it, so the field's
 * `maxlength` is a courtesy to whoever is typing rather than the rule itself.
 *
 * Control characters go first, because a name is one line of text and a peer
 * that sends newlines or nulls is not naming itself. Then the ends are
 * trimmed, the length capped, and the ends trimmed again — a cut can land
 * mid-space, and a name shouldn't end in one.
 */
export const normalizeLabel = (raw: string): string | null => {
  const name = raw
    .replace(/\p{Cc}/gu, '')
    .trim()
    .slice(0, LABEL_MAX_LENGTH)
    .trim();

  return name.length > 0 ? name : null;
};
