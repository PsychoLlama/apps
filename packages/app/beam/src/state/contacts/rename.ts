import { defineFold, defineStore, defineTopic } from '@lib/state';
import { beamScope } from '../scope';
import { contactRenamedTopic, selfNamedTopic } from './contacts';

/**
 * Which record a rename form is aimed at, tagged the same way the stored rows
 * are.
 *
 * Tagged rather than a bare endpoint id because renaming this device and
 * renaming a peer read the current name from different places and write it
 * through different sagas. A form that only knew an address would have to work
 * out which of the two it was, and would answer wrongly in the window after a
 * key rotation, when this device's row is still filed under the address it
 * used to answer on.
 */
export type RenameTarget =
  { kind: 'peer'; endpointId: string } | { kind: 'self' };

/**
 * Which record is being renamed, if any. Held as a target rather than as a
 * bare flag so the dialog is bound to the record it opened over: navigating
 * to another contact leaves it shut rather than aiming the open form at
 * whoever is on screen now.
 */
export interface Rename {
  /** The record whose rename form is open, or `null` when none is. */
  target: RenameTarget | null;
}

/** The record whose rename form is open. */
export const renameStore = defineStore<Rename>(beamScope, () => ({
  target: null,
}));

/** A rename form was opened. */
export const renameOpenedTopic = defineTopic<RenameTarget>();
defineFold(renameOpenedTopic, [renameStore], (rename, target) => {
  rename.target = target;
});

/** A rename form was dismissed without saving. */
export const renameClosedTopic = defineTopic();
defineFold(renameClosedTopic, [renameStore], (rename) => {
  rename.target = null;
});

// A landed rename closes its own form. Folding the address book's own topics
// keeps that automatic — the form doesn't have to remember to shut itself,
// and it can't stay open over a name that already changed.
defineFold(contactRenamedTopic, [renameStore], (rename, { endpointId }) => {
  if (rename.target?.kind !== 'peer') return;
  if (rename.target.endpointId === endpointId) rename.target = null;
});

// The same for this device's own row, which lands as a different fact. There
// is only ever one of it, so there's nothing to match on.
defineFold(selfNamedTopic, [renameStore], (rename) => {
  if (rename.target?.kind === 'self') rename.target = null;
});
