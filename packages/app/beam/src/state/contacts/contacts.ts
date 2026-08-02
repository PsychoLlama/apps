import { defineFold, defineStore, defineTopic } from '@lib/state';
import { beamScope } from '../scope';
import { normalizeLabel } from '../labels';
import type {
  Contact,
  ContactDirection,
  ContactRecord,
  LoadStatus,
} from '../platform/database';

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
      kind: 'peer',
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

/**
 * The reader accepted a peer's request to pair. Only moves a contact that
 * was actually waiting on an answer: a peer already forgotten has nothing to
 * promote, and re-accepting a trusted one is a no-op.
 */
export const pairingAcceptedTopic = defineTopic<string>();
defineFold(pairingAcceptedTopic, [contactsStore], (book, endpointId) => {
  const contact = book.entries[endpointId];
  if (contact?.trust === 'invited') contact.trust = 'trusted';
});

/**
 * A peer said it accepted us. This is the one transition driven by a
 * message from the network rather than by the reader, so it carries the
 * tighter guard: it only counts when *we* are the ones waiting, which means
 * a contact we hold as `invited` **outbound**.
 *
 * Without the direction check, any stranger could dial in — which files them
 * as `invited` inbound — and immediately claim acceptance, promoting itself
 * to `trusted` with nobody ever asked. Trust in that direction is the
 * reader's to grant, and it's granted through
 * {@link pairingAcceptedTopic} alone.
 */
export const pairingConfirmedTopic = defineTopic<string>();
defineFold(pairingConfirmedTopic, [contactsStore], (book, endpointId) => {
  const contact = book.entries[endpointId];
  if (contact?.trust !== 'invited') return;
  if (contact.direction !== 'outbound') return;

  contact.trust = 'trusted';
});

/** A contact was removed from the address book. */
export const contactForgottenTopic = defineTopic<string>();
defineFold(contactForgottenTopic, [contactsStore], (book, endpointId) => {
  delete book.entries[endpointId];
});
