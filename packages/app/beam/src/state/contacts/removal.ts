import { defineFold, defineStore, defineTopic } from '@lib/state-next';
import { beamScope } from '../scope';

/**
 * Which contact's removal is waiting on a confirmation, if any. Forgetting a
 * contact is destructive and can't be undone from here, so the button opens a
 * question rather than carrying it out.
 *
 * Held by endpoint rather than as a bare flag so the confirmation is bound to
 * the record it opened over: it can't end up asking about whoever is on
 * screen now.
 */
export interface Removal {
  /** The contact awaiting confirmation, or `null` when nothing is armed. */
  endpointId: string | null;
}

/** The removal awaiting confirmation. */
export const removalStore = defineStore<Removal>(beamScope, () => ({
  endpointId: null,
}));

/** A removal was proposed and is waiting on an answer. */
export const removalOpenedTopic = defineTopic<string>();
defineFold(removalOpenedTopic, [removalStore], (removal, endpointId) => {
  removal.endpointId = endpointId;
});

/** The question was answered, either way, and is no longer being asked. */
export const removalClosedTopic = defineTopic();
defineFold(removalClosedTopic, [removalStore], (removal) => {
  removal.endpointId = null;
});
