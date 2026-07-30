import { defineScope } from '@lib/state';

/**
 * Owns everything a beam session holds: the relay connection, the QR
 * encoding of its beam link, the address book read back from IndexedDB, and
 * the sagas driving them. `BeamLayout` anchors it for the lifetime of the
 * `/beam/*` surface, so moving between routes beneath it keeps one connection
 * and one loaded address book rather than re-dialling and re-reading.
 * Releasing the last anchor aborts the in-flight sagas and frees the endpoint.
 */
export const beamScope = defineScope();
