import { defineCommand, defineStore } from '@lib/state';
import type { Contact, ContactRecord } from '../platform/database';
import { $invite, $rename } from './dialogs';
import { $identity } from './identity';
import { generateLabel, normalizeLabel } from './labels';
import { $drafts, $shareLog } from './shares';

/**
 * The address book: every peer this device has met, persisted to IndexedDB
 * and loaded once per session. Contacts come into existence by being seen —
 * there's no "add" form — and the only way out of the book is to forget one.
 *
 * A contact is a record, not a permission. Reaching this device means holding
 * its endpoint id, so whether a peer is in the book changes what it's called
 * here, never what it's allowed to do.
 */

/** Every peer this device knows about, as held in memory. */
export interface ContactBook {
  /**
   * Peers by endpoint id. A map rather than a list: every lookup in the app
   * is by endpoint (a beam link, an inbound dial, a route param), and
   * ordering is a rendering concern the address book derives.
   *
   * Peers only. This device's own row comes off the same table in the same
   * read and lands in `$identity` instead, so nothing here has to remember to
   * exclude it.
   */
  entries: Record<string, Contact>;
}

/** One contact as the address book renders it. */
export interface ContactView {
  /** The peer's endpoint public key. */
  endpointId: string;

  /**
   * What to call this contact: its local name, else the name it advertised,
   * else the leading characters of its key.
   */
  name: string;

  /** When the contact first entered the address book. */
  createdAt: number;
}

/**
 * The address book. IndexedDB is the durable copy; this is the working one,
 * loaded once per session and written through on every change.
 */
export const $contacts = defineStore<ContactBook>(() => ({ entries: {} }));

/**
 * The persisted store was read back — every row of it, this device's
 * included. Peers land in the book and the row about ourselves in
 * `$identity`, which is why the device's name doesn't wait on the wasm to
 * say what its address is.
 *
 * Replaces the working copy outright rather than merging: the read runs once
 * per session, before anything can have changed it. A second self row can't
 * exist, but if one somehow did, neither ends up among the peers.
 */
export const $contactsRestored = defineCommand(
  [$contacts, $identity],
  (book, self) => (records: ContactRecord[]) => {
    book.entries = Object.fromEntries(
      records
        .filter((record) => record.kind === 'peer')
        .map((contact) => [contact.endpointId, contact]),
    );

    self.record = records.find((record) => record.kind === 'self') ?? null;
  },
);

/**
 * A peer was seen — dialled by this device, or dialling it. A known peer only
 * gets its clock bumped; `createdAt` records something a later sighting
 * can't change.
 *
 * Meeting a peer is also the invite's errand finishing: the link was handed
 * over and somebody used it, so the dialog holding it up closes.
 */
export const $contactSeen = defineCommand(
  [$contacts, $invite],
  (book, invite) => (endpointId: string, seenAt: number) => {
    invite.open = false;

    const existing = book.entries[endpointId];
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
 * name. A rename form open over this contact closes with it.
 */
export const $contactRenamed = defineCommand(
  [$contacts, $rename],
  (book, rename) => (endpointId: string, label: string | null) => {
    const contact = book.entries[endpointId];
    if (contact) contact.label = label === null ? null : normalizeLabel(label);

    const target = rename.target;
    if (target?.kind === 'peer' && target.endpointId === endpointId) {
      rename.target = null;
    }
  },
);

/**
 * A peer said what it calls itself. Kept apart from {@link Contact.label} so
 * a local name always wins, and normalized on the way in — this one arrives
 * from a stranger, so the cap is doing real work rather than tidying.
 */
export const $contactAdvertised = defineCommand(
  [$contacts],
  (book) => (endpointId: string, label: string) => {
    const contact = book.entries[endpointId];
    if (contact) contact.suggestedLabel = normalizeLabel(label);
  },
);

/**
 * A contact was removed from the address book. What was shared with it and
 * its half-written note go too: nothing should outlive the peer it was
 * addressed to.
 */
export const $contactForgotten = defineCommand(
  [$contacts, $drafts, $shareLog],
  (book, drafts, log) => (endpointId: string) => {
    delete book.entries[endpointId];
    delete drafts.bodies[endpointId];
    log.items = log.items.filter((item) => item.endpointId !== endpointId);
  },
);

// --- Derived ---

/**
 * What a contact is called when it has no local name: the name the peer
 * advertised, else the key prefix. This is what clearing a name falls back
 * to, so the rename form shows it as the field's placeholder.
 */
export const fallbackName = (contact: Contact): string =>
  contact.suggestedLabel ?? generateLabel(contact.endpointId);

/**
 * The address book as the UI reads it: every contact resolved to a display
 * name and sorted by it, so the list holds still as peers come and go. Ties
 * break on endpoint id, which is stable and unique.
 *
 * Names are not deduplicated. Two devices can wear the same one, but
 * renaming either is one tap away, and a peer's page shows the endpoint key,
 * which is the part that can't collide.
 */
export const addressBookOf = (book: ContactBook): ContactView[] =>
  Object.values(book.entries)
    .map((contact): ContactView => ({
      endpointId: contact.endpointId,
      name: contact.label ?? fallbackName(contact),
      createdAt: contact.createdAt,
    }))
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) ||
        left.endpointId.localeCompare(right.endpointId),
    );
