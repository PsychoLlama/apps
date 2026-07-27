import { defineScope } from '@lib/state-next';

/**
 * Owns everything a beam session holds: the relay connection, the QR
 * encoding of its beam link, and the sagas driving them. `BeamLayout`
 * anchors it for the lifetime of the `/beam/*` surface, so moving between
 * routes beneath it keeps one connection rather than re-dialling. Releasing
 * the last anchor aborts the in-flight sagas and frees the relay.
 */
export const beamScope = defineScope();
