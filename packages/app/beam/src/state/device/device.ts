import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import { generateLabel, normalizeLabel } from '../labels';
import { identityStore } from '../session/identity';
import { beamScope } from '../scope';

/**
 * Where the persisted device name sits in its lifecycle. The same four states
 * the address book has, and for the same reason: IndexedDB is client-only, so
 * "no name" and "haven't looked yet" are different things and the reader must
 * not be shown the first while the second is true.
 *
 * - `initial` — the read hasn't been attempted. What prerender and first
 *   paint show.
 * - `loading` — the read is in flight.
 * - `ready` — the name is in memory and authoritative.
 * - `failed` — IndexedDB was unreadable. Distinct from a `ready` device with
 *   no name, which is a device nobody has named yet.
 */
export type DeviceStatus = 'initial' | 'loading' | 'ready' | 'failed';

/** What this device calls itself, as held in memory. */
export interface DeviceProfile {
  /** Where the persisted name sits in its lifecycle. */
  status: DeviceStatus;

  /**
   * The name the reader gave this device, or `null` if they never gave one.
   * `null` is not "unnamed" as far as anyone else is concerned —
   * {@link selfLabelFormula} falls back to the key prefix, which is the same
   * name an unnamed contact wears.
   */
  label: string | null;
}

/**
 * What this device calls itself. IndexedDB is the durable copy; this is the
 * working one, loaded once per session and written through on every change.
 */
export const deviceStore = defineStore<DeviceProfile>(beamScope, () => ({
  status: 'initial',
  label: null,
}));

/** The read of the persisted device name got under way. */
export const deviceLoadingTopic = defineTopic();
defineFold(deviceLoadingTopic, [deviceStore], (device) => {
  device.status = 'loading';
});

/**
 * The persisted device name was read back — `null` where nothing was stored,
 * which is what a device nobody has named looks like.
 */
export const deviceRestoredTopic = defineTopic<string | null>();
defineFold(deviceRestoredTopic, [deviceStore], (device, label) => {
  device.status = 'ready';
  device.label = label === null ? null : normalizeLabel(label);
});

/** The persisted device name couldn't be read. */
export const deviceLoadFailedTopic = defineTopic();
defineFold(deviceLoadFailedTopic, [deviceStore], (device) => {
  device.status = 'failed';
});

/**
 * The reader named this device. Normalized on the way in like every other
 * name, so what the store settles on is what gets written to disk and what
 * every peer is told.
 *
 * Lands `ready` whatever the load did. A name typed just now is the truth
 * about this device regardless of what the disk said a moment ago, and
 * leaving the status at `failed` would have the surface still treating the
 * name as unknown.
 */
export const deviceNamedTopic = defineTopic<string>();
defineFold(deviceNamedTopic, [deviceStore], (device, label) => {
  device.status = 'ready';
  device.label = normalizeLabel(label);
});

/**
 * What this device calls itself, and what it advertises to every peer it
 * links with: the name the reader chose, or the prefix of its own endpoint
 * key until they choose one.
 *
 * The fallback is a real name rather than a placeholder. It's derived from
 * the key, so it needs no exchange to agree on, and it's the same name an
 * unnamed contact goes by — which means a device that reaches a peer before
 * anyone has named it still arrives as somebody.
 *
 * `null` until the key lands, which is a moment or two after mount rather
 * than a relay round trip away.
 */
export const selfLabelFormula = defineFormula(
  [identityStore, deviceStore],
  (self, device) => {
    if (!self.endpointId) return null;
    return device.label ?? generateLabel(self.endpointId);
  },
);
