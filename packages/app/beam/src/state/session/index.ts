/**
 * The `@lib/state` surface backing a beam session: the browser's endpoint
 * connection, the QR encoding of its beam link — which land together as the
 * connection comes up — the name this device goes by, and the links it holds
 * to peers. All of it sits in the beam scope; anchoring that scope is what
 * keeps the session alive, and releasing the last anchor frees the endpoint and
 * every peer link with it.
 *
 * The handshake lives here rather than in the address book because it's
 * about the network: the book records what a pairing *is*, and this decides
 * what a peer on the wire is allowed to change about it. What the two
 * devices then say to each other — text, and the links that are a special
 * case of it — is logged here too, and only here: a share is a hand-off
 * between devices, so it lives and dies with the session.
 */
export { connectionStore } from './connection';
export type { ConnectionStatus } from './connection';
export { qrCodeCell } from './qr-code';
export type { QrGrid } from './qr-code';
export { identityStore, selfLabelFormula } from './identity';
export {
  focusedPeerFormula,
  peerBlurredTopic,
  peerFocusedTopic,
} from './focus';
export { inviteStore, inviteOpenedTopic, inviteClosedTopic } from './invite';
export {
  activePeersFormula,
  pairingRequestsFormula,
  requestDismissedTopic,
  shareStatesFormula,
} from './pairing';
export type { ShareState } from './pairing';
export {
  copyNoticeStore,
  draftChangedTopic,
  draftsStore,
  queuedSharesFormula,
  SHARE_MAX_LENGTH,
  shareLink,
  sharesByPeerFormula,
} from './shares';
export type { Share } from './shares';
export { beamLink } from './capabilities';
export {
  acceptPairingSaga,
  cancelPairingSaga,
  connectRelaySaga,
  copyShareSaga,
  dialPeerSaga,
  disconnectPeerSaga,
  reportSagaFailure,
  shareTextSaga,
} from './sagas';
