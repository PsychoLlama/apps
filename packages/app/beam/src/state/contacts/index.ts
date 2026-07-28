/**
 * The address book: every endpoint this device has paired with, persisted to
 * IndexedDB and loaded into the beam scope once per session. Contacts come
 * into existence by being seen — there's no "add" form — and move along a
 * trust ladder from `invited` to `trusted`. Refusing one is the same as
 * leaving its invite unanswered, so the only way out of the book is to
 * forget it.
 *
 * Reads go through {@link addressBookFormula}, which resolves each contact to
 * a display name and flags the ones whose names collide. Writes go through
 * the sagas, which commit first and write through to disk after.
 */
export { contactsStore } from './contacts';
export { addressBookFormula, MAX_LABEL_LENGTH } from './address-book';
export type { ContactView } from './address-book';
export {
  removalStore,
  removalArmedTopic,
  removalDisarmedTopic,
} from './removal';
export {
  forgetContactSaga,
  recordPeerSaga,
  renameContactSaga,
  restoreContactsSaga,
} from './sagas';
