import { defineFormula } from '@lib/state-next';
import { generateLabel } from '../labels';
import { contactsStore } from './contacts';
import type { Contact, ContactDirection, ContactTrust } from './database';

/** One contact as the address book renders it. */
export interface ContactView {
  /** The peer's endpoint public key. */
  endpointId: string;

  /**
   * What to call this contact: its local name, else the name it advertised,
   * else the leading characters of its key. Any length — a local name is
   * typed here and stored here, so the layout gives way rather than the name.
   */
  name: string;

  /** How far the peer has got along the trust ladder. */
  trust: ContactTrust;

  /** Which side opened the pairing. */
  direction: ContactDirection;

  /** When the contact first entered the address book. */
  createdAt: number;
}

/**
 * Resolve what to call a contact. A local name wins; failing that the peer's
 * own suggestion; failing that the key prefix, which every endpoint has
 * whether or not it ever said anything.
 */
const resolveName = (contact: Contact): string =>
  contact.label ?? contact.suggestedLabel ?? generateLabel(contact.endpointId);

/**
 * The address book as the UI reads it: every contact resolved to a display
 * name and sorted by it, so the list holds still as peers come and go. Ties
 * break on endpoint id, which is stable and unique, so two contacts sharing a
 * name keep a fixed order.
 *
 * Names are not deduplicated. Two devices can wear the same one — a peer
 * picks the name it advertises, and nothing stops it picking one already in
 * the book — but accepting a second of the same name is a choice the reader
 * made, and renaming either is one tap away.
 */
export const addressBookFormula = defineFormula([contactsStore], (book) =>
  Object.values(book.entries)
    .map((contact): ContactView => ({
      endpointId: contact.endpointId,
      name: resolveName(contact),
      trust: contact.trust,
      direction: contact.direction,
      createdAt: contact.createdAt,
    }))
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) ||
        left.endpointId.localeCompare(right.endpointId),
    ),
);
