import { defineFold, defineStore, defineTopic } from '@lib/state';
import { beamScope } from '../scope';
import { normalizeLabel } from '../labels';
import type { Contact, ContactDirection } from './database';

/**
 * Where the persisted address book sits in its lifecycle.
 *
 * - `initial` — the read hasn't been attempted. The site is SSG'd and
 *   IndexedDB is client-only, so this is what prerender and first paint show.
 * - `loading` — the read is in flight.
 * - `ready` — the book is in memory and authoritative.
 * - `failed` — IndexedDB was unreadable (blocked in private mode, quota
 *   trouble). Distinct from an empty `ready` book so the UI can say the
 *   contacts couldn't be loaded rather than claim there are none.
 */
export type ContactBookStatus = 'initial' | 'loading' | 'ready' | 'failed';

/** Every peer this device has paired with, as held in memory. */
export interface ContactBook {
  /** Where the persisted book sits in its lifecycle. */
  status: ContactBookStatus;

  /**
   * Contacts by endpoint id. A map rather than a list: every lookup in the
   * app is by endpoint (a beam link, an inbound dial, a route param), and
   * ordering is a rendering concern the address book derives.
   */
  entries: Record<string, Contact>;
}

/**
 * The address book. IndexedDB is the durable copy; this is the working one,
 * loaded once per session and written through on every change.
 */
export const contactsStore = defineStore<ContactBook>(beamScope, () => ({
  status: 'initial',
  entries: {},
}));

/** The read of the persisted address book got under way. */
export const contactsLoadingTopic = defineTopic();
defineFold(contactsLoadingTopic, [contactsStore], (book) => {
  book.status = 'loading';
});

/**
 * The persisted address book was read back. Replaces the working copy
 * outright rather than merging: the read runs once per session, before
 * anything can have changed it, and a merge would only obscure that.
 */
export const contactsRestoredTopic = defineTopic<Contact[]>();
defineFold(contactsRestoredTopic, [contactsStore], (book, contacts) => {
  book.status = 'ready';
  book.entries = Object.fromEntries(
    contacts.map((contact) => [contact.endpointId, contact]),
  );
});

/** The persisted address book couldn't be read. */
export const contactsLoadFailedTopic = defineTopic();
defineFold(contactsLoadFailedTopic, [contactsStore], (book) => {
  book.status = 'failed';
});

/** A peer was seen — dialled by this device, or dialling it. */
export const contactSeenTopic = defineTopic<{
  /** The peer's endpoint public key. */
  endpointId: string;
  /** Which side opened the pairing. Only used when the contact is new. */
  direction: ContactDirection;
  /** When the sighting happened, in epoch milliseconds. */
  seenAt: number;
}>();

defineFold(
  contactSeenTopic,
  [contactsStore],
  (book, { endpointId, direction, seenAt }) => {
    const existing = book.entries[endpointId];

    // A known peer only gets its clock bumped. Trust and direction record how
    // the pairing began, and seeing someone again is not a reason to revisit
    // either — a re-dial must never talk its way up the trust ladder.
    if (existing) {
      existing.lastSeenAt = seenAt;
      return;
    }

    book.entries[endpointId] = {
      endpointId,
      label: null,
      suggestedLabel: null,
      trust: 'invited',
      direction,
      createdAt: seenAt,
      lastSeenAt: seenAt,
    };
  },
);

/**
 * A contact was renamed. A `null` label clears the local name outright;
 * anything else is normalized, so a blank field clears it too. Either way
 * the contact drops back to whatever it advertised, or to its generated
 * name.
 */
export const contactRenamedTopic = defineTopic<{
  endpointId: string;
  label: string | null;
}>();

defineFold(
  contactRenamedTopic,
  [contactsStore],
  (book, { endpointId, label }) => {
    const contact = book.entries[endpointId];
    if (contact) contact.label = label === null ? null : normalizeLabel(label);
  },
);

/** A contact was removed from the address book. */
export const contactForgottenTopic = defineTopic<string>();
defineFold(contactForgottenTopic, [contactsStore], (book, endpointId) => {
  delete book.entries[endpointId];
});
