/**
 * How a peer reads in a log line: where the pairing stands, not what the
 * transport did. A connection is only interesting for what it means for the
 * pairing, so every event that mentions a peer carries the trust and
 * direction that make it legible — an inbound dial from a stranger and one
 * from a device you paired with last week are the same packet and completely
 * different news.
 *
 * These are the sagas' logs rather than the capabilities' because trust lives
 * in state, and the capability layer can't see it.
 */
export const pairingContext = (
  endpointId: string,
  contact?: { trust: string; direction: string },
) => ({
  endpointId,
  trust: contact?.trust ?? 'unknown',
  direction: contact?.direction ?? 'unknown',
});
