import { call, commit, defineSaga, read } from '@lib/state-next';
import { beamScope } from '../scope';
import {
  contactBlockedTopic,
  contactForgottenTopic,
  contactRenamedTopic,
  contactSeenTopic,
  contactUnblockedTopic,
  contactsLoadFailedTopic,
  contactsLoadingTopic,
  contactsRestoredTopic,
  contactsStore,
} from './contacts';
import { now, readContacts, removeContact, saveContact } from './capabilities';
import type { ContactDirection } from './database';

/**
 * Write a contact's current in-memory state through to IndexedDB. Every
 * change commits first and persists after, so the UI answers the tap on the
 * same frame and disk catches up behind it; this is the "catches up" half.
 *
 * Reads the record back out of the store rather than taking it as an
 * argument, so the fold stays the single place that decides what a change
 * means. The spread copies the store's view into a plain object — IndexedDB
 * structured-clones what it's handed, and a reactive proxy is not what we
 * want on disk. A missing contact is a no-op: it was forgotten between the
 * commit and here.
 */
const persistContactSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    const { entries } = yield* read(contactsStore);
    const contact = entries[endpointId];
    if (!contact) return;

    yield* call(saveContact, { ...contact });
  },
);

/**
 * Load the persisted address book into memory. `BeamLayout` runs it once as
 * the surface mounts — IndexedDB is client-only, so it can't run during SSG.
 *
 * Guarded on `initial` so a second anchor can't re-read the book and clobber
 * changes made since the first read landed.
 */
export const restoreContactsSaga = defineSaga(beamScope, async function* () {
  const { status } = yield* read(contactsStore);
  if (status !== 'initial') return;

  yield commit(contactsLoadingTopic());

  try {
    const contacts = yield* call(readContacts);
    yield commit(contactsRestoredTopic(contacts));
  } catch {
    // Reported by the capability, which has the context to describe it.
    yield commit(contactsLoadFailedTopic());
  }
});

/**
 * Note that a peer was seen, adding it to the address book if it's new.
 * Sighting a peer is the only way a contact comes into existence: there's no
 * "add contact" form, because a contact is the record of an endpoint that
 * actually connected.
 */
export const recordPeerSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; direction: ContactDirection }) {
    const seenAt = yield* call(now);

    yield commit(contactSeenTopic({ ...input, seenAt }));
    yield* persistContactSaga(input.endpointId);
  },
);

/**
 * Rename a contact, or clear the local name with `null` so it falls back to
 * what the peer advertised (or to its generated name).
 */
export const renameContactSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; label: string | null }) {
    yield commit(contactRenamedTopic(input));
    yield* persistContactSaga(input.endpointId);
  },
);

/** Refuse a contact. */
export const blockContactSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    yield commit(contactBlockedTopic(endpointId));
    yield* persistContactSaga(endpointId);
  },
);

/** Lift a block, dropping the contact back to an unanswered invite. */
export const unblockContactSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    yield commit(contactUnblockedTopic(endpointId));
    yield* persistContactSaga(endpointId);
  },
);

/**
 * Forget a contact outright. Unlike a block this leaves nothing behind, so
 * the peer is a stranger again the next time it turns up.
 */
export const forgetContactSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    yield commit(contactForgottenTopic(endpointId));
    yield* call(removeContact, endpointId);
  },
);
