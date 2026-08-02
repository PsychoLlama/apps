/**
 * Being connected: the browser's membership in the iroh relay network, the
 * links it holds to peers, and what the two devices say over them.
 *
 * All of it sits in the beam scope; anchoring that scope is what keeps a
 * session alive, and releasing the last anchor frees the endpoint and every
 * peer link with it.
 *
 * Reading peer messages lives here rather than in the address book because
 * it's about the network: the book records what a peer *is*, and this decides
 * what one on the wire is allowed to change about it. Getting a share onto
 * that wire is here for the same reason — `state/shares` owns the log, and
 * delivery is a property of the link.
 */
export { connectionStore } from './connection';
export type { ConnectionStatus } from './connection';
export { activePeersFormula, peerStatesFormula } from './presence';
export type { PeerState } from './presence';
export { connectRelaySaga } from './sagas/relay';
export { dialPeerSaga, disconnectPeerSaga } from './sagas/link';
export { renameDeviceSaga } from './sagas/messages';
export { shareTextSaga } from './sagas/shares';
