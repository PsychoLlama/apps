import { collect } from '@lib/effects';
import { readContacts, removeContact, saveContact } from '../platform/database';
import {
  $contactAdvertised,
  $contactForgotten,
  $contactRenamed,
  $contacts,
  $contactSeen,
  $contactsRestored,
  type ContactBook,
} from '../state';

// Every change commits first and persists after, so the UI answers the tap on
// the same frame and disk catches up behind it. Read back out of the store so
// the command stays the one place that decides what a change means; the
// spread copies the proxy into a plain object for IndexedDB to clone. A
// missing contact was forgotten in between.
const persist = async (book: ContactBook, endpointId: string) => {
  const contact = book.entries[endpointId];
  if (contact) await saveContact({ ...contact });
};

/**
 * Load the persisted address book, and this device's own row with it.
 * Client-only, so the layout holds it from mount.
 */
export const $restoreContacts = collect(
  [$contactsRestored],
  async (contactsRestored) => {
    contactsRestored(await readContacts());
  },
);

/**
 * Note that a peer was seen, adding it to the address book if it's new.
 * Sighting a peer is the only way a contact comes into existence.
 */
export const $recordPeer = collect(
  [$contacts, $contactSeen],
  (book, contactSeen) => async (endpointId: string) => {
    contactSeen(endpointId, Date.now());
    await persist(book, endpointId);
  },
);

/**
 * Rename a contact, or clear the local name with `null` so it falls back to
 * what the peer advertised (or to its generated name).
 */
export const $renameContact = collect(
  [$contacts, $contactRenamed],
  (book, contactRenamed) =>
    async (endpointId: string, label: string | null) => {
      contactRenamed(endpointId, label);
      await persist(book, endpointId);
    },
);

/**
 * Record the name a peer advertised for itself. Kept apart from the local
 * name, so this can never overwrite one the reader typed.
 */
export const $noteAdvertisedName = collect(
  [$contacts, $contactAdvertised],
  (book, contactAdvertised) => async (endpointId: string, label: string) => {
    contactAdvertised(endpointId, label);
    await persist(book, endpointId);
  },
);

/**
 * Forget a contact outright, so the peer arrives unrecognized the next time
 * it turns up. It doesn't lock anyone out: whoever holds this device's beam
 * link can still reach it, and doing so files them afresh.
 */
export const $forgetContact = collect(
  [$contactForgotten],
  (contactForgotten) => async (endpointId: string) => {
    contactForgotten(endpointId);
    await removeContact(endpointId);
  },
);
