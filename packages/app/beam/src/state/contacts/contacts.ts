import { defineFold, defineStore, defineTopic } from '@lib/state';
import { beamScope } from '../scope';
import { normalizeLabel } from '../labels';
import type { Contact, ContactRecord, LoadStatus } from '../platform/database';

/** Every peer this device knows about, as held in memory. */
export interface ContactBook {
  /** Where the persisted book sits in its lifecycle. */
  status: LoadStatus;

  /**
   * Peers by endpoint id. A map rather than a list: every lookup in the app
   * is by endpoint (a beam link, an inbound dial, a route param), and
   * ordering is a rendering concern the address book derives.
   *
   * Peers only. This device's own row comes off the same table in the same
   * read and lands in `state/identity` instead, so nothing here has to
   * remember to exclude it.
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
 * The persisted store was read back — every row of it, this device's
 * included. Replaces the working copy outright rather than merging: the read
 * runs once per session, before anything can have changed it, and a merge
 * would only obscure that.
 *
 * Exported because it's the address book's outbound contract: one read, one
 * fact, and `state/identity` folds the same one to pick up the row about
 * ourselves. The split by `kind` happens in each fold rather than in the
 * capability, so the rule that decides what a row is lives beside the state
 * it fills.
 */
export const contactsRestoredTopic = defineTopic<ContactRecord[]>();
defineFold(contactsRestoredTopic, [contactsStore], (book, records) => {
  book.status = 'ready';
  book.entries = Object.fromEntries(
    records
      .filter((record) => record.kind === 'peer')
      .map((contact) => [contact.endpointId, contact]),
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
  /** When the sighting happened, in epoch milliseconds. */
  seenAt: number;
}>();

defineFold(
  contactSeenTopic,
  [contactsStore],
  (book, { endpointId, seenAt }) => {
    const existing = book.entries[endpointId];

    // A known peer only gets its clock bumped. `createdAt` is the one field
    // that records something a later sighting can't change, so meeting again
    // must not overwrite it.
    if (existing) {
      existing.lastSeenAt = seenAt;
      return;
    }

    book.entries[endpointId] = {
      kind: 'peer',
      endpointId,
      label: null,
      suggestedLabel: null,
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

/**
 * A peer said what it calls itself. Kept apart from {@link Contact.label} so
 * a local name always wins, and normalized on the way in like every other
 * name — this one arrives from an unauthenticated stranger, so the cap is
 * doing real work rather than tidying.
 */
export const contactAdvertisedTopic = defineTopic<{
  endpointId: string;
  label: string;
}>();

defineFold(
  contactAdvertisedTopic,
  [contactsStore],
  (book, { endpointId, label }) => {
    const contact = book.entries[endpointId];
    if (contact) contact.suggestedLabel = normalizeLabel(label);
  },
);

/** A contact was removed from the address book. */
export const contactForgottenTopic = defineTopic<string>();
defineFold(contactForgottenTopic, [contactsStore], (book, endpointId) => {
  delete book.entries[endpointId];
});
