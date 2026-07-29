/**
 * The `@lib/state` surface backing a beam session: the browser's relay
 * connection, the QR encoding of its beam link — which land together as the
 * connection comes up — the name this device goes by, and the links it holds
 * to peers. All of it sits in the beam scope; anchoring that scope is what
 * keeps the session alive, and releasing the last anchor frees the relay and
 * every peer link with it.
 *
 * The handshake lives here rather than in the address book because it's
 * about the network: the book records what a pairing *is*, and this decides
 * what a peer on the wire is allowed to change about it.
 */
export { connectionStore, relayCell } from './connection';
export { qrCodeCell } from './qr-code';
export type { QrGrid } from './qr-code';
export { selfLabelFormula } from './identity';
export { inviteStore, inviteOpenedTopic, inviteClosedTopic } from './invite';
export {
  pairingRequestsFormula,
  requestDismissedTopic,
  shareStatesFormula,
} from './pairing';
export type { ShareState } from './pairing';
export { beamLink } from './capabilities';
export {
  acceptPairingSaga,
  cancelPairingSaga,
  connectRelaySaga,
  dialPeerSaga,
  reportSagaFailure,
} from './sagas';
