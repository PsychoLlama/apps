/**
 * How a peer reads in a log line: which endpoint, and whether this device had
 * met it before. A dial from a device you talked to last week and one from an
 * endpoint that has never turned up are the same packet and different news,
 * and `known` is the whole of what separates them.
 *
 * These are the sagas' logs rather than the capabilities' because the address
 * book lives in state, and the capability layer can't see it.
 */
export const peerContext = (endpointId: string, known: boolean) => ({
  endpointId,
  known,
});
