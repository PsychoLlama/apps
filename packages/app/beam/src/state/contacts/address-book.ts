import { defineFormula } from '@lib/state-next';
import { generateLabel, keyFragment } from '../labels';
import { contactsStore } from './contacts';
import type { Contact, ContactDirection, ContactTrust } from './database';

/**
 * How long a name may be before the address book truncates it. The peer's
 * suggestion arrives from an unauthenticated stranger, so it's capped on the
 * way to the screen: a name is a name, not a paragraph, and an unbounded one
 * would let a peer push the rest of a row off-screen. The rename field caps
 * itself to the same length so a local name is never silently trimmed.
 */
export const MAX_LABEL_LENGTH = 32;

/** One contact as the address book renders it. */
export interface ContactView {
  /** The peer's endpoint public key. */
  endpointId: string;

  /**
   * What to call this contact: its local name, else the name it advertised,
   * else the name generated from its key. Already capped in length.
   */
  name: string;

  /** Leading characters of the key, shown when {@link ambiguous}. */
  fragment: string;

  /**
   * Whether another contact renders under the same name. Generated names
   * collide and a peer can advertise any name it likes — including one
   * already in the book — so a colliding row shows its key fragment.
   */
  ambiguous: boolean;

  /** How far the peer has got along the trust ladder. */
  trust: ContactTrust;

  /** Which side opened the pairing. */
  direction: ContactDirection;

  /** When the contact first entered the address book. */
  createdAt: number;

  /** When the peer was last seen. */
  lastSeenAt: number;
}

/**
 * Resolve what to call a contact. A local name wins; failing that the peer's
 * own suggestion; failing that a name generated from the key, which every
 * endpoint has whether or not it ever said anything.
 *
 * A blocked contact never wears its suggested name — the block is a judgement
 * about the peer, and letting a blocked stranger keep choosing the words next
 * to it hands them a message board. A local name still stands: that one was
 * typed here.
 */
const resolveName = (contact: Contact): string => {
  if (contact.label) return contact.label.slice(0, MAX_LABEL_LENGTH);

  if (contact.suggestedLabel && contact.trust !== 'blocked') {
    return contact.suggestedLabel.slice(0, MAX_LABEL_LENGTH);
  }

  return generateLabel(contact.endpointId);
};

/**
 * The address book as the UI reads it: every contact resolved to a display
 * name, flagged if that name collides with another's, and sorted by name so
 * the list holds still as peers come and go. Ties break on endpoint id, which
 * is stable and unique, so two same-named contacts keep a fixed order.
 *
 * One list rather than one per section — callers partition it by `trust`,
 * which keeps name collisions visible across the whole book instead of only
 * within a section.
 */
export const addressBookFormula = defineFormula([contactsStore], (book) => {
  const contacts = Object.values(book.entries).map(
    (contact): Omit<ContactView, 'ambiguous'> => ({
      endpointId: contact.endpointId,
      name: resolveName(contact),
      fragment: keyFragment(contact.endpointId),
      trust: contact.trust,
      direction: contact.direction,
      createdAt: contact.createdAt,
      lastSeenAt: contact.lastSeenAt,
    }),
  );

  const occurrences = new Map<string, number>();
  for (const contact of contacts) {
    occurrences.set(contact.name, (occurrences.get(contact.name) ?? 0) + 1);
  }

  return contacts
    .map((contact): ContactView => ({
      ...contact,
      ambiguous: (occurrences.get(contact.name) ?? 0) > 1,
    }))
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) ||
        left.endpointId.localeCompare(right.endpointId),
    );
});
