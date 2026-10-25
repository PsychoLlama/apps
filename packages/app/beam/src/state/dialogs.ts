import { defineCell, defineCommand } from '@lib/state';

/**
 * Which of beam's three modals is open, and over what.
 *
 * Together rather than one per feature, because a modal isn't a feature's
 * state — it's the screen's. The commands that finish each errand close the
 * dialog holding it up, so a form never stays open over a name that already
 * changed.
 *
 * None of it is persisted. Leaving the app releases the cells and takes
 * every open dialog with them, rather than stranding one over a page nobody
 * is looking at.
 */

/** Whether the invite is on screen. The dialog is fully controlled. */
export const $inviteOpen = defineCell(() => false);

/** The invite was asked for. */
export const $inviteOpened = defineCommand(
  [$inviteOpen],
  ([, setOpen]) =>
    () => {
      setOpen(true);
    },
);

/** The invite was dismissed. */
export const $inviteClosed = defineCommand(
  [$inviteOpen],
  ([, setOpen]) =>
    () => {
      setOpen(false);
    },
);

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
 * The record whose rename form is open, or `null` when none is. Held as a
 * target rather than as a bare flag so the dialog is bound to the record it
 * opened over: navigating to another contact leaves it shut rather than
 * aiming the open form at whoever is on screen now.
 */
export const $renameTarget = defineCell<RenameTarget | null>(() => null);

/** A rename form was opened. */
export const $renameOpened = defineCommand(
  [$renameTarget],
  ([, setTarget]) =>
    (target: RenameTarget) => {
      setTarget(target);
    },
);

/** A rename form was dismissed without saving. */
export const $renameClosed = defineCommand(
  [$renameTarget],
  ([, setTarget]) =>
    () => {
      setTarget(null);
    },
);

/**
 * The contact whose removal is waiting on a confirmation, or `null` when
 * nothing is armed. Forgetting a contact is destructive and can't be undone
 * from here, so the button opens a question rather than carrying it out.
 *
 * Held by endpoint rather than as a bare flag so the confirmation is bound to
 * the record it opened over: it can't end up asking about whoever is on
 * screen now.
 */
export const $removalTarget = defineCell<string | null>(() => null);

/** A removal was proposed and is waiting on an answer. */
export const $removalOpened = defineCommand(
  [$removalTarget],
  ([, setTarget]) =>
    (endpointId: string) => {
      setTarget(endpointId);
    },
);

/** The question was answered, either way, and is no longer being asked. */
export const $removalClosed = defineCommand(
  [$removalTarget],
  ([, setTarget]) =>
    () => {
      setTarget(null);
    },
);
