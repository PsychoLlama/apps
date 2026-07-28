/**
 * Fallback names for endpoints. A beam endpoint is a 32-byte public key
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
