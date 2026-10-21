import { defineCell, defineCommand, defineStore } from '@lib/state';
import type { SelfContact } from '../platform/database';
import type { QrGrid } from '../platform/qr-code';
import { $rename } from './dialogs';
import { generateLabel, normalizeLabel } from './labels';
import { $setupDraft } from './onboarding';

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
 * reaches into the book is asking about somebody else, and a row about
 * yourself sitting in there would have to be excluded by every one of those
 * readers, forever, correctly.
 */
export interface DeviceIdentity {
  /**
   * This device's endpoint address, or `null` before the key has been
   * loaded — including during SSG and first paint.
   *
   * The public half only. The secret it's derived from stays in the platform
   * layer and never reaches a store: it *is* this device, and state here is
   * read by anything that asks.
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
export const $identity = defineStore<DeviceIdentity>(() => ({
  endpointId: null,
  record: null,
}));

/**
 * The QR rendering of this device's beam link. A cell, not store state —
 * the grid is a byte buffer a reactive store must never proxy. `null` until
 * the encode lands, and if the encode failed.
 */
export const $qrCode = defineCell<QrGrid | null>(() => null);

/**
 * The endpoint key was restored or minted, settling this device's address.
 * Far earlier than the connection landing, which is what lets the header
 * name this device, and the invite show its link, while the handshake is
 * still in flight.
 */
export const $identityResolved = defineCommand(
  [$identity],
  (self) => (endpointId: string) => {
    self.endpointId = endpointId;
  },
);

/**
 * The reader named this device. Normalized on the way in like every other
 * name; a `null` or blank label clears it, dropping the device back to the
 * prefix of its own key.
 *
 * Renaming keeps the row's original date: a device named twice is the same
 * device. A key that changed underneath moves the row to the new address,
 * because the name belongs to the device rather than to the key.
 *
 * The setup form has nothing left to hold once the name lands, and an open
 * rename form for this device has done its job, so both close here.
 */
export const $deviceNamed = defineCommand(
  [$identity, $setupDraft, $rename],
  (self, draft, rename) =>
    (endpointId: string, label: string | null, at: number) => {
      self.record = {
        kind: 'self',
        endpointId,
        label: label === null ? null : normalizeLabel(label),
        createdAt: self.record?.createdAt ?? at,
      };

      draft.name = '';
      if (rename.target?.kind === 'self') rename.target = null;
    },
);

/**
 * The beam link was encoded into a scannable grid, or `null` if the encode
 * failed. Failure is non-fatal — the link is still copyable from its text
 * field — so this is published either way.
 */
export const $codeEncoded = defineCommand(
  [$qrCode],
  ([, setCode]) =>
    (grid: QrGrid | null) => {
      setCode(() => grid);
    },
);

// --- Derived ---

/**
 * What this device calls itself, and what it advertises to every peer it
 * links with: the name the reader chose, or the prefix of its own endpoint
 * key until they choose one. Read off the live key rather than the row's own
 * `endpointId`, which is where the key was when the name was typed.
 *
 * `null` until the key lands.
 */
export const deviceNameOf = (self: DeviceIdentity): string | null => {
  if (!self.endpointId) return null;
  return self.record?.label ?? generateLabel(self.endpointId);
};

/**
 * What this device would be called if nobody had named it — what clearing
 * the name falls back to, so the rename form shows it as the placeholder.
 * Empty until the key lands.
 */
export const deviceFallbackOf = (self: DeviceIdentity): string =>
  self.endpointId ? generateLabel(self.endpointId) : '';
