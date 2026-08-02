import { defineFold, defineStore, defineTopic } from '@lib/state';
import { contactRenamedTopic, contactSeenTopic } from '../contacts';
import { deviceNamedTopic } from '../identity';
import { beamScope } from '../scope';

/**
 * Which of beam's three modals is open, and over what.
 *
 * Together rather than one per feature, because a modal isn't a feature's
 * state — it's the screen's. Each of these sits above the thing it's about
 * and folds that thing's topics to get out of the way when the errand
 * finishes, which is a dependency that only points one way: the address book
 * doesn't know a rename form exists, and shouldn't.
 *
 * None of it is persisted. Walking away from `/beam` releases the scope and
 * takes every open dialog with it, rather than stranding one over a page
 * nobody is looking at.
 */

/** Whether the invite is on screen. */
export interface Invite {
  /** Whether the invite dialog is showing. */
  open: boolean;
}

/**
 * Whether the invite is on screen. The dialog is fully controlled, and Solid's
 * local state primitives are off-limits in app packages, so the flag lives in
 * the scope like everything else.
 */
export const inviteStore = defineStore<Invite>(beamScope, () => ({
  open: false,
}));

/** The invite was asked for. */
export const inviteOpenedTopic = defineTopic();
defineFold(inviteOpenedTopic, [inviteStore], (invite) => {
  invite.open = true;
});

/** The invite was dismissed. */
export const inviteClosedTopic = defineTopic();
defineFold(inviteClosedTopic, [inviteStore], (invite) => {
  invite.open = false;
});

// A peer dialling in is the errand finishing: the link was handed over and
// somebody used it. Getting the dialog out of the way is what lets the
// request behind it be seen — it's a modal, so a pairing request that
// arrives while it's up would otherwise sit under the overlay unnoticed.
//
// Only an inbound sighting. Our own dial, from a share view, is us going
// somewhere rather than someone arriving.
defineFold(contactSeenTopic, [inviteStore], (invite, { direction }) => {
  if (direction === 'inbound') invite.open = false;
});

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

// A landed rename closes its own form. Folding the topics the name itself
// publishes keeps that automatic — the form doesn't have to remember to shut
// itself, and it can't stay open over a name that already changed.
defineFold(contactRenamedTopic, [renameStore], (rename, { endpointId }) => {
  if (rename.target?.kind !== 'peer') return;
  if (rename.target.endpointId === endpointId) rename.target = null;
});

// The same for this device's own row, which lands as a different fact. There
// is only ever one of it, so there's nothing to match on.
defineFold(deviceNamedTopic, [renameStore], (rename) => {
  if (rename.target?.kind === 'self') rename.target = null;
});

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
