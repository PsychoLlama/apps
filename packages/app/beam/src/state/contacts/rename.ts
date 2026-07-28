import { defineFold, defineStore, defineTopic } from '@lib/state';
import { beamScope } from '../scope';
import { contactRenamedTopic } from './contacts';

/**
 * Which contact is being renamed, if any. Held by endpoint rather than as a
 * bare flag so the dialog is bound to the record it opened over: navigating
 * to another contact leaves it shut rather than aiming the open form at
 * whoever is on screen now.
 */
export interface Rename {
  /** The contact whose rename form is open, or `null` when none is. */
  endpointId: string | null;
}

/** The contact whose rename form is open. */
export const renameStore = defineStore<Rename>(beamScope, () => ({
  endpointId: null,
}));

/** A rename form was opened. */
export const renameOpenedTopic = defineTopic<string>();
defineFold(renameOpenedTopic, [renameStore], (rename, endpointId) => {
  rename.endpointId = endpointId;
});

/** A rename form was dismissed without saving. */
export const renameClosedTopic = defineTopic();
defineFold(renameClosedTopic, [renameStore], (rename) => {
  rename.endpointId = null;
});

// A landed rename closes its own form. Folding the address book's own topic
// keeps that automatic — the form doesn't have to remember to shut itself,
// and it can't stay open over a name that already changed.
defineFold(contactRenamedTopic, [renameStore], (rename, { endpointId }) => {
  if (rename.endpointId === endpointId) rename.endpointId = null;
});
