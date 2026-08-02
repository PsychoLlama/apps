import { defineFold, defineStore, defineTopic } from '@lib/state';
import { contactsRestoredTopic } from '../contacts';
import { normalizeLabel } from '../labels';
import { beamScope } from '../scope';
import type { SelfContact } from '../platform/database';

/**
 * Who this device is: the address it answers on, and the name it goes by.
 *
 * Two facts that settle at different times and from different places. The
 * address comes off the endpoint key, which is minted or restored the moment
 * the wasm is up — no network, no disk read of its own. The name comes off
 * the contact store, in the same read that loads the address book, because on
 * disk this device is a row like any other endpoint.
 *
 * Its own store rather than a corner of the address book. Everything that
 * reaches into the book is asking about somebody else — what they're called,
 * whether they're trusted, whether to send them a share — and a row about
 * yourself sitting in there would have to be excluded by every one of those
 * readers, forever, correctly. Here it simply isn't reachable by the
 * question, and the two halves of "who am I" sit together instead of a key in
 * one store and a name in another.
 */
export interface DeviceIdentity {
  /**
   * This device's endpoint address, or `null` before the key has been
   * loaded — including during SSG and first paint.
   *
   * The public half only. The secret it's derived from stays in the
   * capability layer and never reaches a store: it *is* this device, and
   * state here is read by anything that asks.
   */
  endpointId: string | null;

  /**
   * This device's row as the contact store holds it, or `null` until somebody
   * names it. Kept whole rather than flattened because it's what goes back to
   * disk, and because its own `endpointId` is not the live one: it records
   * where the key was when the name was typed, which is what lets a rotated
   * key clean up the row it left behind.
   */
  record: SelfContact | null;
}

/** Who this device is. */
export const identityStore = defineStore<DeviceIdentity>(beamScope, () => ({
  endpointId: null,
  record: null,
}));

/**
 * The endpoint key was restored or minted, settling this device's address.
 *
 * Its own fact rather than part of the connection landing, because it happens
 * far earlier: the address is derived from the key, so it's readable as soon
 * as the wasm is up and the vault has answered — no relay involved. That's
 * what lets the header name this device, and the invite show its link, while
 * the handshake is still in flight.
 */
export const identityResolvedTopic = defineTopic<string>();
defineFold(identityResolvedTopic, [identityStore], (self, endpointId) => {
  self.endpointId = endpointId;
});

/**
 * The reader named this device. Normalized on the way in like every other
 * name, so what the store settles on is what gets written to disk and what
 * every peer is told. A `null` label clears the name outright, and a blank one
 * clears it too — either way the device drops back to the prefix of its own
 * key, which is a real name rather than an absence.
 *
 * Renaming keeps the row's original date: a device named twice is the same
 * device, and `createdAt` is when it first became one. A key that changed
 * underneath — the vault cleared, a fresh identity minted — moves the row to
 * the new address, because the name belongs to the device rather than to the
 * key it happens to hold.
 */
export const deviceNamedTopic = defineTopic<{
  /** This device's current endpoint address. */
  endpointId: string;
  /** The name typed for it, as typed, or `null` to clear it. */
  label: string | null;
  /** When it was named, in epoch milliseconds. */
  at: number;
}>();

defineFold(
  deviceNamedTopic,
  [identityStore],
  (self, { endpointId, label, at }) => {
    self.record = {
      kind: 'self',
      endpointId,
      label: label === null ? null : normalizeLabel(label),
      createdAt: self.record?.createdAt ?? at,
    };
  },
);

// One table, one read, two destinations. The address book takes the peers and
// this takes the row about ourselves — which is why the read can land the
// device's name without waiting on the wasm to say what its address is.
//
// A second self row can't exist (one device, one key at a time), but if one
// somehow did, the last read wins and neither ends up among the peers.
defineFold(contactsRestoredTopic, [identityStore], (self, records) => {
  self.record = records.find((record) => record.kind === 'self') ?? null;
});
