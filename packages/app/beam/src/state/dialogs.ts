import { defineCommand, defineStore } from '@lib/state';

/**
 * Which of beam's three modals is open, and over what.
 *
 * Together rather than one per feature, because a modal isn't a feature's
 * state — it's the screen's. The commands that finish each errand close the
 * dialog holding it up, so a form never stays open over a name that already
 * changed.
 *
 * None of it is persisted. Leaving the app releases the stores and takes
 * every open dialog with them, rather than stranding one over a page nobody
 * is looking at.
 */

/** Whether the invite is on screen. */
export interface Invite {
  /** Whether the invite dialog is showing. */
  open: boolean;
}

/** Whether the invite is on screen. The dialog is fully controlled. */
export const $invite = defineStore<Invite>(() => ({ open: false }));

/** The invite was asked for. */
export const $inviteOpened = defineCommand([$invite], (invite) => () => {
  invite.open = true;
});

/** The invite was dismissed. */
export const $inviteClosed = defineCommand([$invite], (invite) => () => {
  invite.open = false;
});

/**
 * Which record a rename form is aimed at, tagged the same way the stored rows
 * are.
 *
 * Tagged rather than a bare endpoint id because renaming this device and
 * renaming a peer read the current name from different places and write it
 * through different effects. A form that only knew an address would have to
 * work out which of the two it was, and would answer wrongly in the window
 * after a key rotation, when this device's row is still filed under the
 * address it used to answer on.
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
export const $rename = defineStore<Rename>(() => ({ target: null }));

/** A rename form was opened. */
export const $renameOpened = defineCommand(
  [$rename],
  (rename) => (target: RenameTarget) => {
    rename.target = target;
  },
);

/** A rename form was dismissed without saving. */
export const $renameClosed = defineCommand([$rename], (rename) => () => {
  rename.target = null;
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
export const $removal = defineStore<Removal>(() => ({ endpointId: null }));

/** A removal was proposed and is waiting on an answer. */
export const $removalOpened = defineCommand(
  [$removal],
  (removal) => (endpointId: string) => {
    removal.endpointId = endpointId;
  },
);

/** The question was answered, either way, and is no longer being asked. */
export const $removalClosed = defineCommand([$removal], (removal) => () => {
  removal.endpointId = null;
});
