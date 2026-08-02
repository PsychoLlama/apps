import { call, commit, defineSaga, read } from '@lib/state';
import { beamScope } from '../scope';
import {
  contactAdvertisedTopic,
  contactForgottenTopic,
  contactRenamedTopic,
  contactSeenTopic,
  contactsLoadFailedTopic,
  contactsLoadingTopic,
  contactsRestoredTopic,
  contactsStore,
  pairingAcceptedTopic,
  pairingConfirmedTopic,
  selfNamedTopic,
} from './contacts';
import { now, readContacts, removeContact, saveContact } from './capabilities';
import { identityStore } from '../session/identity';
import { normalizeLabel } from '../labels';
import type { ContactDirection } from '../database';

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
 * Rename this device, answering whether it took. An emptied field clears the
 * name, dropping the device back to the prefix of its own key — the same
 * fallback an unnamed contact wears, so it's a name rather than a blank.
 *
 * Needs the key, so it can't run before one lands. In practice one always
 * has: the key is minted on load and this is driven by a button.
 *
 * A row left at an address this device no longer answers on is deleted rather
 * than left behind. The name follows the device, so a rotated key would
 * otherwise leave a second self row on disk — and the read that picks one of
 * them up would be picking arbitrarily.
 */
export const renameSelfSaga = defineSaga(
  beamScope,
  async function* (label: string | null) {
    const { endpointId } = yield* read(identityStore);
    if (!endpointId) return false;

    const previous = (yield* read(contactsStore)).self?.endpointId;
    const at = yield* call(now);

    yield commit(selfNamedTopic({ endpointId, label, at }));

    if (previous && previous !== endpointId) {
      yield* call(removeContact, previous);
    }

    const { self } = yield* read(contactsStore);
    if (self) yield* call(saveContact, { ...self });

    return true;
  },
);

/**
 * Name this device for the first time, answering whether it took.
 *
 * The same write as a rename, with the one rule setup adds: a blank is
 * refused rather than accepted as a name. Clearing a name later is a choice
 * about what to fall back to; a blank field at the step whose whole purpose is
 * to collect a name is an unanswered question, and the answer is what setup
 * waits on before moving off it.
 */
export const nameSelfSaga = defineSaga(
  beamScope,
  async function* (raw: string) {
    const label = normalizeLabel(raw);
    if (!label) return false;

    return yield* renameSelfSaga(label);
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

/**
 * Record the name a peer advertised for itself. Kept apart from the local
 * name, so this can never overwrite one the reader typed.
 */
export const noteAdvertisedNameSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; label: string }) {
    yield commit(contactAdvertisedTopic(input));
    yield* persistContactSaga(input.endpointId);
  },
);

/**
 * Accept a peer's request to pair, promoting it to `trusted` here. Telling
 * the peer is the session layer's job — this is only the half that has to
 * survive a reload.
 */
export const acceptContactSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    yield commit(pairingAcceptedTopic(endpointId));
    yield* persistContactSaga(endpointId);
  },
);

/**
 * Record that a peer accepted an invite we sent it. The fold decides whether
 * to believe it — see {@link pairingConfirmedTopic}, which ignores the claim
 * unless we're the side that was waiting.
 */
export const confirmContactSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    yield commit(pairingConfirmedTopic(endpointId));
    yield* persistContactSaga(endpointId);
  },
);

/**
 * Forget a contact outright. This leaves nothing behind, so the peer is a
 * stranger again the next time it turns up — which is also how you refuse
 * one, since an unanswered invite grants nothing in the first place.
 */
export const forgetContactSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    yield commit(contactForgottenTopic(endpointId));
    yield* call(removeContact, endpointId);
  },
);
