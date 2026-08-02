/**
 * The address book: every endpoint this device has paired with, persisted to
 * IndexedDB and loaded into the beam scope once per session. Contacts come
 * into existence by being seen — there's no "add" form — and move along a
 * trust ladder from `invited` to `trusted`. Refusing one is the same as
 * leaving its invite unanswered, so the only way out of the book is to
 * forget it.
 *
 * This device's own row lives in the same table — an endpoint with a name on
 * it is the same kind of thing whoever it's about — but beside the peers
 * rather than among them, so nothing that asks the book about somebody else
 * can be answered with yourself.
 *
 * Reads go through {@link addressBookFormula}, which resolves each contact to
 * a display name and flags the ones whose names collide. Writes go through
 * the sagas, which commit first and write through to disk after.
 */
export {
  contactForgottenTopic,
  contactSeenTopic,
  contactsStore,
} from './contacts';
export { selfLabelFormula } from './self';
export { addressBookFormula, fallbackName } from './address-book';
export type { ContactView } from './address-book';
export { renameStore, renameOpenedTopic, renameClosedTopic } from './rename';
export {
  removalStore,
  removalOpenedTopic,
  removalClosedTopic,
} from './removal';
export {
  acceptContactSaga,
  confirmContactSaga,
  forgetContactSaga,
  nameSelfSaga,
  noteAdvertisedNameSaga,
  recordPeerSaga,
  renameContactSaga,
  restoreContactsSaga,
} from './sagas';
