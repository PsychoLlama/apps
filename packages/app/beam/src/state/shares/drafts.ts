import { defineFold, defineStore, defineTopic } from '@lib/state';
import { contactForgottenTopic } from '../contacts';
import { beamScope } from '../scope';

/**
 * What the reader has typed but not yet sent, per peer. Kept in the scope
 * rather than the textarea so moving between the share view and a contact's
 * page doesn't quietly discard a half-written note — and, like every other
 * piece of screen state here, because Solid's local state primitives are
 * off-limits in app packages.
 */
export interface Drafts {
  /** The unsent body for each peer, keyed by endpoint id. */
  bodies: Record<string, string>;
}

/** What the reader has typed but not yet sent. */
export const draftsStore = defineStore<Drafts>(beamScope, () => ({
  bodies: {},
}));

/** The reader typed into a peer's composer. */
export const draftChangedTopic = defineTopic<{
  endpointId: string;
  body: string;
}>();

defineFold(draftChangedTopic, [draftsStore], (drafts, { endpointId, body }) => {
  drafts.bodies[endpointId] = body;
});

/** A draft was sent, or given up on. */
export const draftClearedTopic = defineTopic<string>();
defineFold(draftClearedTopic, [draftsStore], (drafts, endpointId) => {
  delete drafts.bodies[endpointId];
});

// A forgotten contact takes its half-written note with it, the same as its
// shares. Nothing here should outlive the peer it was addressed to.
defineFold(contactForgottenTopic, [draftsStore], (drafts, endpointId) => {
  delete drafts.bodies[endpointId];
});
