/**
 * The address book: every peer this device has paired with, persisted to
 * IndexedDB and loaded into the beam scope once per session. Contacts come
 * into existence by being seen — there's no "add" form — and move along a
 * trust ladder from `invited` to `trusted`. Refusing one is the same as
 * leaving its invite unanswered, so the only way out of the book is to
 * forget it.
 *
 * Peers only. This device's own row comes off the same table in the same read
 * and lands in `state/identity`, so nothing that asks the book about somebody
 * else can be answered with yourself.
 *
 * Reads go through {@link addressBookFormula}, which resolves each contact to
 * a display name and orders them. Writes go through the sagas, which commit
 * first and write through to disk after.
 */
export {
  contactForgottenTopic,
  contactRenamedTopic,
  contactSeenTopic,
  contactsRestoredTopic,
  contactsStore,
} from './contacts';
export { addressBookFormula, fallbackName } from './directory';
export type { ContactView } from './directory';
export {
  acceptContactSaga,
  confirmContactSaga,
  forgetContactSaga,
  noteAdvertisedNameSaga,
  recordPeerSaga,
  renameContactSaga,
  restoreContactsSaga,
} from './sagas';
