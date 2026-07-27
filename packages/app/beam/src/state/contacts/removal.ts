import { defineFold, defineStore, defineTopic } from '@lib/state-next';
import { beamScope } from '../scope';
import { contactForgottenTopic } from './contacts';

/**
 * Which contact's removal is waiting on a confirmation, if any. Forgetting a
 * contact is destructive and irreversible, so the button asks twice: the
 * first press arms it, the second carries it out.
 *
 * The armed contact lives in the scope rather than in a component because
 * that's where application state lives here — and it means walking away from
 * the page disarms it, which is the behaviour you'd want anyway.
 */
export interface Removal {
  /** The contact awaiting confirmation, or `null` when nothing is armed. */
  endpointId: string | null;
}

/** The removal awaiting confirmation. */
export const removalStore = defineStore<Removal>(beamScope, () => ({
  endpointId: null,
}));

/** A removal was armed and is waiting on a second press. */
export const removalArmedTopic = defineTopic<string>();
defineFold(removalArmedTopic, [removalStore], (removal, endpointId) => {
  removal.endpointId = endpointId;
});

/** The armed removal was called off. */
export const removalDisarmedTopic = defineTopic();
defineFold(removalDisarmedTopic, [removalStore], (removal) => {
  removal.endpointId = null;
});

// A carried-out removal disarms itself. Folding the address book's own topic
// keeps that automatic — nothing has to remember to clear this alongside the
// delete, and a removal that lands from anywhere else clears it too.
defineFold(contactForgottenTopic, [removalStore], (removal, endpointId) => {
  if (removal.endpointId === endpointId) removal.endpointId = null;
});
