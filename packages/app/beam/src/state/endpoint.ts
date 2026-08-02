/**
 * What an endpoint address is, and the link that carries one.
 *
 * An endpoint id is a 32-byte ed25519 public key rendered as lowercase hex —
 * the value a beam link carries in its path. It reaches this app from the URL
 * bar as readily as from a scanned code, so something has to say whether a
 * given string could be an address at all, and something has to build the URL
 * that hands one over.
 *
 * Both are pure text rules with no state and no I/O behind them, which is why
 * they sit above the features rather than inside the transport that dials
 * them: the share view checks an id before the wasm is up, and the invite
 * renders a link the moment the key lands.
 */

/**
 * What an endpoint id looks like: 32 bytes of public key, hex-encoded.
 * Lowercase only, and deliberately — iroh's own parser rejects the uppercase
 * spelling (`failed to decode hex string`), and every id in circulation comes
 * from the encoder on the other side of that parser. Accepting a spelling the
 * dial would refuse is the bug this exists to prevent, in a smaller form.
 */
const ENDPOINT_ID_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Whether a string could be an endpoint address. Format only: this mirrors
 * what iroh's parser accepts, which is the same question asked one layer down
 * — it tells you the string is *shaped* like a key, never that a device
 * answering to it exists.
 *
 * That distinction is the whole of what this is for. A well-formed id for a
 * device that's asleep is a contact worth keeping, since the link that named
 * it may not come round again; a malformed one can never be dialled by
 * anyone, so recording it would leave a permanent row for a peer that was
 * never real.
 */
export const isEndpointId = (value: string): boolean =>
  ENDPOINT_ID_PATTERN.test(value);

/**
 * The beam link to an endpoint — the `/beam/share/:id` URL a peer opens to
 * dial it. Only ever built client-side (this device's own id is `null` until
 * the client-only key load lands), so `window.location.origin` is safe to
 * read.
 */
export const beamLink = (endpointId: string): string =>
  new URL(`/beam/share/${endpointId}`, window.location.origin).href;
