/**
 * The `@lib/state-next` surface backing a beam session: the browser's relay
 * connection, the QR encoding of its beam link — which land together as the
 * connection comes up — and the name this device goes by. All of it sits in
 * the beam scope; anchoring that scope is what keeps the session alive, and
 * releasing the last anchor frees the relay.
 */
export { connectionStore, relayCell } from './connection';
export { qrCodeCell } from './qr-code';
export type { QrGrid } from './qr-code';
export { selfLabelFormula } from './identity';
export { inviteStore, inviteOpenedTopic, inviteClosedTopic } from './invite';
export { beamLink } from './capabilities';
export { connectRelaySaga, dialPeerSaga, reportSagaFailure } from './sagas';
