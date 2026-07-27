/**
 * The `@lib/state-next` surface backing a beam session: one scope owning the
 * browser's relay connection and the QR encoding of its beam link, which land
 * together as the connection comes up. Anchoring the scope is what keeps the
 * session alive; releasing the last anchor frees the relay.
 */
export { beamScope } from './scope';
export { connectionStore, relayCell } from './connection';
export { qrCodeCell } from './qr-code';
export type { QrGrid } from './qr-code';
export { beamLink } from './capabilities';
export { connectRelaySaga, dialPeerSaga, reportSagaFailure } from './sagas';
